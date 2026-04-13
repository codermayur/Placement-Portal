const ok = (res, data, status = 200) =>
  res.status(status).json({ success: true, data, error: null });

const fail = (res, status, message, details = null) =>
  res.status(status).json({
    success: false,
    data: null,
    error: { message, details },
  });

module.exports = { ok, fail };
