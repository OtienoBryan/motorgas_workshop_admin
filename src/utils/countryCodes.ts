export interface CountryDialCode {
  iso: string
  name: string
  dial: string
}

// [ISO 3166-1 alpha-2, name, international dialing code]
const RAW: [string, string, string][] = [
  ['KE', 'Kenya', '+254'], ['UG', 'Uganda', '+256'], ['TZ', 'Tanzania', '+255'], ['RW', 'Rwanda', '+250'],
  ['BI', 'Burundi', '+257'], ['SS', 'South Sudan', '+211'], ['SD', 'Sudan', '+249'], ['ET', 'Ethiopia', '+251'],
  ['SO', 'Somalia', '+252'], ['DJ', 'Djibouti', '+253'], ['ER', 'Eritrea', '+291'], ['CD', 'DR Congo', '+243'],
  ['CG', 'Congo', '+242'], ['ZM', 'Zambia', '+260'], ['MW', 'Malawi', '+265'], ['MZ', 'Mozambique', '+258'],
  ['ZW', 'Zimbabwe', '+263'], ['BW', 'Botswana', '+267'], ['NA', 'Namibia', '+264'], ['ZA', 'South Africa', '+27'],
  ['LS', 'Lesotho', '+266'], ['SZ', 'Eswatini', '+268'], ['AO', 'Angola', '+244'], ['MG', 'Madagascar', '+261'],
  ['MU', 'Mauritius', '+230'], ['SC', 'Seychelles', '+248'], ['KM', 'Comoros', '+269'],
  ['NG', 'Nigeria', '+234'], ['GH', 'Ghana', '+233'], ['CI', "Côte d'Ivoire", '+225'], ['SN', 'Senegal', '+221'],
  ['ML', 'Mali', '+223'], ['BF', 'Burkina Faso', '+226'], ['NE', 'Niger', '+227'], ['TD', 'Chad', '+235'],
  ['CM', 'Cameroon', '+237'], ['GA', 'Gabon', '+241'], ['GN', 'Guinea', '+224'], ['SL', 'Sierra Leone', '+232'],
  ['LR', 'Liberia', '+231'], ['TG', 'Togo', '+228'], ['BJ', 'Benin', '+229'], ['GM', 'Gambia', '+220'],
  ['MR', 'Mauritania', '+222'], ['CV', 'Cape Verde', '+238'],
  ['EG', 'Egypt', '+20'], ['LY', 'Libya', '+218'], ['TN', 'Tunisia', '+216'], ['DZ', 'Algeria', '+213'],
  ['MA', 'Morocco', '+212'],
  ['AE', 'United Arab Emirates', '+971'], ['SA', 'Saudi Arabia', '+966'], ['QA', 'Qatar', '+974'],
  ['KW', 'Kuwait', '+965'], ['BH', 'Bahrain', '+973'], ['OM', 'Oman', '+968'], ['YE', 'Yemen', '+967'],
  ['JO', 'Jordan', '+962'], ['LB', 'Lebanon', '+961'], ['SY', 'Syria', '+963'], ['IQ', 'Iraq', '+964'],
  ['IR', 'Iran', '+98'], ['IL', 'Israel', '+972'], ['TR', 'Turkey', '+90'],
  ['IN', 'India', '+91'], ['PK', 'Pakistan', '+92'], ['BD', 'Bangladesh', '+880'], ['LK', 'Sri Lanka', '+94'],
  ['NP', 'Nepal', '+977'], ['CN', 'China', '+86'], ['HK', 'Hong Kong', '+852'], ['JP', 'Japan', '+81'],
  ['KR', 'South Korea', '+82'], ['SG', 'Singapore', '+65'], ['MY', 'Malaysia', '+60'], ['TH', 'Thailand', '+66'],
  ['VN', 'Vietnam', '+84'], ['PH', 'Philippines', '+63'], ['ID', 'Indonesia', '+62'],
  ['US', 'United States', '+1'], ['CA', 'Canada', '+1'], ['MX', 'Mexico', '+52'], ['BR', 'Brazil', '+55'],
  ['AR', 'Argentina', '+54'], ['CL', 'Chile', '+56'], ['CO', 'Colombia', '+57'], ['PE', 'Peru', '+51'],
  ['GB', 'United Kingdom', '+44'], ['IE', 'Ireland', '+353'], ['FR', 'France', '+33'], ['DE', 'Germany', '+49'],
  ['IT', 'Italy', '+39'], ['ES', 'Spain', '+34'], ['PT', 'Portugal', '+351'], ['NL', 'Netherlands', '+31'],
  ['BE', 'Belgium', '+32'], ['CH', 'Switzerland', '+41'], ['AT', 'Austria', '+43'], ['SE', 'Sweden', '+46'],
  ['NO', 'Norway', '+47'], ['DK', 'Denmark', '+45'], ['FI', 'Finland', '+358'], ['PL', 'Poland', '+48'],
  ['GR', 'Greece', '+30'], ['RU', 'Russia', '+7'], ['UA', 'Ukraine', '+380'],
  ['AU', 'Australia', '+61'], ['NZ', 'New Zealand', '+64'],
]

export const COUNTRY_DIAL_CODES: CountryDialCode[] = RAW.map(([iso, name, dial]) => ({ iso, name, dial }))

export const DEFAULT_COUNTRY_ISO = 'KE'

export const countryFlag = (iso: string) =>
  String.fromCodePoint(...iso.toUpperCase().split('').map(c => 0x1f1e6 + c.charCodeAt(0) - 65))

/** Splits a stored phone number like "+254712345678" into its country and national number. */
export const splitPhone = (full: string): { iso: string; number: string } => {
  const value = (full || '').trim().replace(/[\s-]/g, '')
  if (!value.startsWith('+')) return { iso: DEFAULT_COUNTRY_ISO, number: value }
  const match = [...COUNTRY_DIAL_CODES]
    .sort((a, b) => b.dial.length - a.dial.length)
    .find(c => value.startsWith(c.dial))
  if (!match) return { iso: DEFAULT_COUNTRY_ISO, number: value }
  // +1 is shared by US/Canada; pick the first listed
  return { iso: match.iso, number: value.slice(match.dial.length) }
}

/** Joins a country and national number into "+<code><number>", dropping a leading trunk zero. */
export const joinPhone = (iso: string, number: string): string => {
  const digits = (number || '').trim().replace(/[\s-]/g, '')
  if (!digits) return ''
  const dial = COUNTRY_DIAL_CODES.find(c => c.iso === iso)?.dial ?? ''
  return `${dial}${digits.replace(/^0+/, '')}`
}
