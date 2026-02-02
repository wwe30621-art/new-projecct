export function getApiErrorMessage(e: any, fallback = "Request failed") {
  return e?.response?.data?.message || e?.message || fallback;
}
