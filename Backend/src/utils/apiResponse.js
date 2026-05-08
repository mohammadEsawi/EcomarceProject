/**
 * Standard API response helpers.
 * All functions return the Express response object so callers can `return` them.
 */

/**
 * 200 OK — generic success.
 * @param {import('express').Response} res
 * @param {*} data
 * @param {string} [message='Success']
 * @param {number} [statusCode=200]
 */
export const success = (res, data, message = 'Success', statusCode = 200) =>
  res.status(statusCode).json({ success: true, message, data });

/**
 * 201 Created — resource successfully created.
 * @param {import('express').Response} res
 * @param {*} data
 * @param {string} [message='Resource created successfully']
 */
export const created = (res, data, message = 'Resource created successfully') =>
  res.status(201).json({ success: true, message, data });

/**
 * 4xx / 5xx error response.
 * @param {import('express').Response} res
 * @param {string} [message='Bad request']
 * @param {number} [statusCode=400]
 * @param {Array|object|null} [errors=null] - Optional validation errors or extra detail
 */
export const error = (res, message = 'Bad request', statusCode = 400, errors = null) => {
  const body = { success: false, message };
  if (errors !== null) body.errors = errors;
  return res.status(statusCode).json(body);
};

/**
 * 404 Not Found.
 * @param {import('express').Response} res
 * @param {string} [message='Resource not found']
 */
export const notFound = (res, message = 'Resource not found') =>
  res.status(404).json({ success: false, message });

/**
 * 401 Unauthorized — missing or invalid credentials.
 * @param {import('express').Response} res
 * @param {string} [message='Unauthorized']
 */
export const unauthorized = (res, message = 'Unauthorized') =>
  res.status(401).json({ success: false, message });

/**
 * 403 Forbidden — authenticated but not permitted.
 * @param {import('express').Response} res
 * @param {string} [message='Forbidden']
 */
export const forbidden = (res, message = 'Forbidden') =>
  res.status(403).json({ success: false, message });
