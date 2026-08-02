// Strips the password hash before a record ever leaves the server.
export function omitPassword(record) {
  if (!record) return record;
  const { password, ...safe } = record;
  return safe;
}
