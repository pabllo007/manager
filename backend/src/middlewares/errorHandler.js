export function errorHandler(err, req, res, _next) {
  const status = Number(err?.status) || 500;
  const payload = {
    error: {
      code: status >= 500 ? 'INTERNAL_ERROR' : 'REQUEST_ERROR',
      message: err?.message || 'Erro interno',
      details: err?.details,
      traceId: req.requestId,
    },
  };

  if (status >= 500) {
    console.error(`[${req.requestId}]`, err);
  }

  res.status(status).json(payload);
}
