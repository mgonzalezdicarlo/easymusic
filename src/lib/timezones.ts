/** IANA timezone names for the pickers. "UTC" is added because the runtime list omits it. */
export function listTimezones(): string[] {
  return [
    "UTC",
    ...Intl.supportedValuesOf("timeZone").filter((z) => z !== "UTC"),
  ];
}
