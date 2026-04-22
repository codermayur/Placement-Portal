import { createContext, useContext, useReducer, useCallback, useRef, useEffect } from 'react';
import api from '../api';
import { extractApiData } from '../api';

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

const opportunitiesReducer = (state, action) => {
  switch (action.type) {
    case 'SET_OPPORTUNITIES':
      return {
        ...state,
        opportunities: { active: action.active, archive: action.archive },
        lastFetch: Date.now(),
      };
    case 'UPDATE_OPPORTUNITY':
      const updateOpp = (list, id, updates) =>
        list.map(opp => opp._id === id ? { ...opp, ...updates } : opp);

      return {
        ...state,
        opportunities: {
          active: updateOpp(state.opportunities.active || [], action.id, action.updates),
          archive: updateOpp(state.opportunities.archive || [], action.id, action.updates),
        },
      };
    case 'INVALIDATE_CACHE':
      return { ...state, lastFetch: 0 };
    case 'SET_TIMELINE':
      return {
        ...state,
        timelines: {
          ...state.timelines,
          [action.opportunityId]: {
            data: Array.isArray(action.data) ? action.data : [],
            timestamp: Date.now(),
          },
        },
      };
    case 'SET_ATTENDANCE':
      return {
        ...state,
        attendance: {
          ...state.attendance,
          [`${action.opportunityId}:${action.stage}`]: {
            data: Array.isArray(action.data) ? action.data : [],
            timestamp: Date.now(),
          },
        },
      };
    default:
      return state;
  }
};

const initialState = {
  opportunities: { active: [], archive: [] },
  timelines: {},
  attendance: {},
  applicantCounts: {},
  lastFetch: 0,
  loading: false,
};

const OpportunitiesContext = createContext();

export const OpportunitiesProvider = ({ children }) => {
  const [state, dispatch] = useReducer(opportunitiesReducer, initialState);
  const cacheRef = useRef(state);

  const fetchOpportunities = useCallback(async () => {
    const now = Date.now();
    if (now - state.lastFetch < CACHE_DURATION) return state.opportunities;

    dispatch({ type: 'INVALIDATE_CACHE' });
    try {
      const [activeRes, archiveRes] = await Promise.all([
        api.get('/opportunities/active'),
        api.get('/opportunities/archive'),
      ]);
      const active = extractApiData(activeRes) || [];
      const archive = extractApiData(archiveRes) || [];
      dispatch({ type: 'SET_OPPORTUNITIES', active, archive });
      return { active, archive };
    } catch (error) {
      console.error('Failed to fetch opportunities:', error);
      return state.opportunities;
    }
  }, [state.lastFetch]);

  const fetchTimeline = useCallback(async (opportunityId) => {
    const cached = state.timelines[opportunityId];
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      return Array.isArray(cached.data) ? cached.data : [];
    }

    try {
      const controller = new AbortController();
      const response = await api.get(`/timeline/${opportunityId}`, { signal: controller.signal });
      const data = extractApiData(response);
      console.log('Context fetchTimeline raw data:', data);
      // Backend returns { timeline: [...], activeStages: [...] }
      const timelineData = Array.isArray(data?.timeline) ? data.timeline : [];
      dispatch({ type: 'SET_TIMELINE', opportunityId, data: timelineData });
      return timelineData;
    } catch (error) {
      if (error.name !== 'AbortError') console.error('Timeline fetch failed:', error);
      return [];
    }
  }, [state.timelines]);

  const fetchAttendance = useCallback(async (opportunityId, stage) => {
    const cacheKey = `${opportunityId}:${stage}`;
    const cached = state.attendance[cacheKey];
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      return Array.isArray(cached.data) ? cached.data : [];
    }

    try {
      const controller = new AbortController();
      const response = await api.get(`/attendance/${opportunityId}/${stage}`, { signal: controller.signal });
      const data = extractApiData(response);
      const attendanceData = Array.isArray(data) ? data : [];
      dispatch({ type: 'SET_ATTENDANCE', opportunityId, stage, data: attendanceData });
      return attendanceData;
    } catch (error) {
      if (error.name !== 'AbortError') console.error('Attendance fetch failed:', error);
      return [];
    }
  }, [state.attendance]);

  const updateOpportunityApplied = useCallback((id, hasApplied = true) => {
    dispatch({
      type: 'UPDATE_OPPORTUNITY',
      id,
      updates: { hasApplied },
    });
  }, []);

  const value = {
    opportunities: state.opportunities,
    timelines: state.timelines,
    attendance: state.attendance,
    fetchOpportunities,
    fetchTimeline,
    fetchAttendance,
    updateOpportunityApplied,
    refetch: () => dispatch({ type: 'INVALIDATE_CACHE' }),
  };

  useEffect(() => {
    cacheRef.current = value;
  }, [value]);

  return (
    <OpportunitiesContext.Provider value={value}>
      {children}
    </OpportunitiesContext.Provider>
  );
};

export const useOpportunities = () => {
  const context = useContext(OpportunitiesContext);
  if (!context) {
    throw new Error('useOpportunities must be used within OpportunitiesProvider');
  }
  return context;
};
