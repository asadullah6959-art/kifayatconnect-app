export interface LocationOption {
  code: string;
  name: string;
}

export interface ProvinceData {
  name: string;
  districts: {
    name: string;
    tehsils: string[];
    majorCities: string[];
    sampleUCs: string[];
  }[];
}

export const COUNTRIES = ['Pakistan'];

export const PROVINCES_DATA: Record<string, ProvinceData> = {
  'Punjab': {
    name: 'Punjab',
    districts: [
      {
        name: 'Lahore',
        tehsils: ['Model Town', 'Lahore Cantt', 'Lahore City', 'Shalimar', 'Raiwind'],
        majorCities: ['Lahore'],
        sampleUCs: ['UC-112 Model Town', 'UC-119 Cavalry Ground', 'UC-95 Gulberg III', 'UC-108 Johar Town', 'UC-74 Shadman', 'UC-132 DHA Phase 5']
      },
      {
        name: 'Faisalabad',
        tehsils: ['Faisalabad City', 'Faisalabad Saddar', 'Jaranwala', 'Samundri', 'Tandlianwala'],
        majorCities: ['Faisalabad', 'Jaranwala', 'Samundri'],
        sampleUCs: ['UC-21 D-Ground', 'UC-14 Madina Town', 'UC-08 Ghulam Muhammad Abad', 'UC-33 Peoples Colony']
      },
      {
        name: 'Rawalpindi',
        tehsils: ['Rawalpindi', 'Gujar Khan', 'Kahuta', 'Murree', 'Taxila'],
        majorCities: ['Rawalpindi', 'Gujar Khan', 'Taxila'],
        sampleUCs: ['UC-41 Satellite Town', 'UC-12 Saddar', 'UC-28 Westridge', 'UC-55 Bahria Town']
      },
      {
        name: 'Multan',
        tehsils: ['Multan City', 'Multan Saddar', 'Shujabad', 'Jalalpur Pirwala'],
        majorCities: ['Multan', 'Shujabad'],
        sampleUCs: ['UC-33 Gulgasht Colony', 'UC-19 Cantt', 'UC-05 Shah Rukn-e-Alam', 'UC-42 Bosan Road']
      },
      {
        name: 'Gujranwala',
        tehsils: ['Gujranwala City', 'Gujranwala Saddar', 'Kamoke', 'Nowshera Virkan', 'Wazirabad'],
        majorCities: ['Gujranwala', 'Kamoke', 'Wazirabad'],
        sampleUCs: ['UC-18 Model Town', 'UC-09 Satellite Town', 'UC-25 DC Colony', 'UC-44 Cantt']
      },
      {
        name: 'Sialkot',
        tehsils: ['Sialkot', 'Daska', 'Pasrur', 'Sambrial'],
        majorCities: ['Sialkot', 'Daska', 'Sambrial'],
        sampleUCs: ['UC-06 Cantt', 'UC-15 Model Town', 'UC-29 Paris Road', 'UC-38 Small Industries Estate']
      }
    ]
  },
  'Sindh': {
    name: 'Sindh',
    districts: [
      {
        name: 'Karachi South',
        tehsils: ['Saddar', 'Civil Lines', 'Aram Bagh', 'Garden', 'Lyari'],
        majorCities: ['Karachi'],
        sampleUCs: ['UC-45 Clifton / DHA', 'UC-42 Clifton Block 2', 'UC-11 Saddar Bazaar', 'UC-03 Kharadar', 'UC-08 PECHS Phase 1']
      },
      {
        name: 'Karachi Central',
        tehsils: ['North Nazimabad', 'Gulberg', 'Liaquatabad', 'New Karachi'],
        majorCities: ['Karachi'],
        sampleUCs: ['UC-05 Block H North Nazimabad', 'UC-18 Federal B Area', 'UC-24 Buffer Zone', 'UC-09 Liaquatabad C-1']
      },
      {
        name: 'Karachi East',
        tehsils: ['Gulshan-e-Iqbal', 'Jamshed Quarters', 'Ferozabad'],
        majorCities: ['Karachi'],
        sampleUCs: ['UC-14 Gulshan Block 13', 'UC-22 Bahadurabad', 'UC-29 Tariq Road', 'UC-07 Soldier Bazaar']
      },
      {
        name: 'Hyderabad',
        tehsils: ['Hyderabad City', 'Latifabad', 'Qasimabad', 'Hyderabad Rural'],
        majorCities: ['Hyderabad'],
        sampleUCs: ['UC-08 Latifabad Unit 7', 'UC-12 Qasimabad Phase 1', 'UC-03 Saddar Cantt', 'UC-19 Auto Bhan']
      },
      {
        name: 'Sukkur',
        tehsils: ['Sukkur City', 'New Sukkur', 'Rohri', 'Pano Aqil', 'Salehpat'],
        majorCities: ['Sukkur', 'Rohri', 'Pano Aqil'],
        sampleUCs: ['UC-04 Military Road', 'UC-09 Barrage Colony', 'UC-14 Old Sukkur', 'UC-02 Station Road']
      }
    ]
  },
  'Islamabad Capital Territory': {
    name: 'Islamabad Capital Territory',
    districts: [
      {
        name: 'Islamabad',
        tehsils: ['Islamabad City', 'Sihala', 'Nilore'],
        majorCities: ['Islamabad'],
        sampleUCs: ['UC-01 Secretariat & Red Zone', 'UC-24 Sector G-11', 'UC-19 Sector F-8/F-7', 'UC-30 Sector I-8', 'UC-36 DHA Phase 2', 'UC-15 Blue Area']
      }
    ]
  },
  'Khyber Pakhtunkhwa': {
    name: 'Khyber Pakhtunkhwa',
    districts: [
      {
        name: 'Peshawar',
        tehsils: ['Peshawar City', 'Shah Alam', 'Saddar', 'Badaber', 'Chamkani'],
        majorCities: ['Peshawar'],
        sampleUCs: ['UC-15 Hayatabad Phase 3', 'UC-08 University Town', 'UC-22 Cantt', 'UC-04 Qissa Khwani', 'UC-31 Ring Road']
      },
      {
        name: 'Abbottabad',
        tehsils: ['Abbottabad', 'Havelian', 'Lora'],
        majorCities: ['Abbottabad', 'Havelian'],
        sampleUCs: ['UC-02 Mandian', 'UC-07 Supply Bazaar', 'UC-11 Cantt', 'UC-05 Jinnahabad']
      },
      {
        name: 'Mardan',
        tehsils: ['Mardan', 'Takht Bhai', 'Katlang', 'Rustam', 'Garhi Kapura'],
        majorCities: ['Mardan', 'Takht Bhai'],
        sampleUCs: ['UC-03 Cantt', 'UC-09 Baghdada', 'UC-16 Bank Road', 'UC-21 Hoti']
      },
      {
        name: 'Swat',
        tehsils: ['Babuzai', 'Matta', 'Khwazakhela', 'Barikot', 'Kabal', 'Charbagh', 'Bahrain'],
        majorCities: ['Mingora', 'Barikot', 'Matta'],
        sampleUCs: ['UC-01 Mingora City', 'UC-06 Saidu Sharif', 'UC-12 Fizagat', 'UC-18 Kanju']
      }
    ]
  },
  'Balochistan': {
    name: 'Balochistan',
    districts: [
      {
        name: 'Quetta',
        tehsils: ['Quetta City', 'Chiltan', 'Zarghoon', 'Panjpai', 'Sadar'],
        majorCities: ['Quetta'],
        sampleUCs: ['UC-08 Zarghoon Road', 'UC-03 Cantt', 'UC-14 Jinnah Town', 'UC-22 Shahrah-e-Iqbal', 'UC-29 Satellite Town']
      },
      {
        name: 'Gwadar',
        tehsils: ['Gwadar', 'Pasni', 'Ormara', 'Jiwani'],
        majorCities: ['Gwadar', 'Pasni', 'Ormara'],
        sampleUCs: ['UC-01 Port & Marine Drive', 'UC-04 Shahi Bazaar', 'UC-07 New Town']
      },
      {
        name: 'Khuzdar',
        tehsils: ['Khuzdar', 'Zehri', 'Nal', 'Wadh', 'Mula'],
        majorCities: ['Khuzdar'],
        sampleUCs: ['UC-02 Central City', 'UC-05 RCD Highway', 'UC-09 Civil Colony']
      }
    ]
  },
  'Azad Jammu & Kashmir': {
    name: 'Azad Jammu & Kashmir',
    districts: [
      {
        name: 'Muzaffarabad',
        tehsils: ['Muzaffarabad', 'Pattika / Naseerabad'],
        majorCities: ['Muzaffarabad'],
        sampleUCs: ['UC-01 Secretariat Road', 'UC-04 Domel', 'UC-08 Upper Chattar']
      },
      {
        name: 'Mirpur',
        tehsils: ['Mirpur', 'Dadyal'],
        majorCities: ['Mirpur', 'Dadyal'],
        sampleUCs: ['UC-02 Sector F-1', 'UC-06 Allama Iqbal Road', 'UC-10 Housing Scheme']
      }
    ]
  },
  'Gilgit-Baltistan': {
    name: 'Gilgit-Baltistan',
    districts: [
      {
        name: 'Gilgit',
        tehsils: ['Gilgit', 'Danyore', 'Juglot'],
        majorCities: ['Gilgit', 'Danyore'],
        sampleUCs: ['UC-01 Airport Road', 'UC-03 Jutial', 'UC-05 City Bazaar']
      },
      {
        name: 'Skardu',
        tehsils: ['Skardu', 'Gultari', 'Rondu'],
        majorCities: ['Skardu'],
        sampleUCs: ['UC-01 Yadgar Chowk', 'UC-04 Sadpara Road', 'UC-07 Gamba']
      }
    ]
  }
};

export const PROVINCE_OPTIONS = Object.keys(PROVINCES_DATA);

export function getDistrictsForProvince(province: string): string[] {
  const pData = PROVINCES_DATA[province];
  if (!pData) return [];
  return pData.districts.map(d => d.name);
}

export function getTehsilsForDistrict(province: string, district: string): string[] {
  const pData = PROVINCES_DATA[province];
  if (!pData) return [];
  const dData = pData.districts.find(d => d.name.toLowerCase() === district.toLowerCase());
  return dData ? dData.tehsils : [];
}

export function getSampleUCsForDistrict(province: string, district: string): string[] {
  const pData = PROVINCES_DATA[province];
  if (!pData) return [];
  const dData = pData.districts.find(d => d.name.toLowerCase() === district.toLowerCase());
  return dData ? dData.sampleUCs : [];
}

export function getMajorCitiesForDistrict(province: string, district: string): string[] {
  const pData = PROVINCES_DATA[province];
  if (!pData) return [];
  const dData = pData.districts.find(d => d.name.toLowerCase() === district.toLowerCase());
  return dData ? dData.majorCities : [];
}

export interface LocationHierarchyFields {
  country?: string;
  stateProvince?: string;
  district?: string;
  tehsil?: string;
  cityTown?: string;
  unionCouncil?: string;
  region?: string; // Legacy fallback
}

/**
 * Returns a full hierarchical string:
 * Country → State/Province → District → Tehsil → City/Town → Union Council
 */
export function formatFullLocationHierarchy(loc?: LocationHierarchyFields): string {
  if (!loc) return 'Pakistan';
  const parts: string[] = [];
  if (loc.country) parts.push(loc.country);
  if (loc.stateProvince) parts.push(loc.stateProvince);
  if (loc.district) parts.push(loc.district);
  if (loc.tehsil) parts.push(`Tehsil ${loc.tehsil}`);
  if (loc.cityTown && loc.cityTown !== loc.district) parts.push(loc.cityTown);
  if (loc.unionCouncil) parts.push(loc.unionCouncil);

  if (parts.length === 0 && loc.region) return loc.region;
  return parts.length > 0 ? parts.join(' → ') : 'Pakistan';
}

/**
 * Returns short administrative location (e.g. "Lahore, Punjab" or "UC-112, Lahore")
 */
export function formatShortLocation(loc?: LocationHierarchyFields): string {
  if (!loc) return 'Unassigned';
  if (loc.district && loc.stateProvince) {
    return `${loc.district}, ${loc.stateProvince}`;
  }
  if (loc.district) return loc.district;
  if (loc.stateProvince) return loc.stateProvince;
  if (loc.region) return loc.region;
  return loc.country || 'Pakistan';
}

/**
 * Returns detailed civic address string
 */
export function formatCivicAddress(loc?: LocationHierarchyFields): string {
  if (!loc) return '';
  const parts: string[] = [];
  if (loc.unionCouncil) parts.push(loc.unionCouncil);
  if (loc.tehsil) parts.push(`Tehsil ${loc.tehsil}`);
  if (loc.cityTown) parts.push(loc.cityTown);
  if (loc.district && loc.district !== loc.cityTown) parts.push(`Dist. ${loc.district}`);
  if (loc.stateProvince) parts.push(loc.stateProvince);
  if (loc.country) parts.push(loc.country);

  if (parts.length === 0 && loc.region) return loc.region;
  return parts.join(', ');
}

/**
 * Maps legacy Region strings to hierarchical fields
 */
export function mapLegacyRegionToHierarchy(region?: string): {
  country: string;
  stateProvince: string;
  district: string;
  tehsil: string;
  cityTown: string;
  unionCouncil: string;
} {
  const norm = (region || '').toLowerCase();
  if (norm.includes('lahore')) {
    return {
      country: 'Pakistan',
      stateProvince: 'Punjab',
      district: 'Lahore',
      tehsil: 'Model Town',
      cityTown: 'Lahore',
      unionCouncil: 'UC-112 Model Town'
    };
  }
  if (norm.includes('karachi')) {
    return {
      country: 'Pakistan',
      stateProvince: 'Sindh',
      district: 'Karachi South',
      tehsil: 'Saddar',
      cityTown: 'Karachi',
      unionCouncil: 'UC-45 Clifton / DHA'
    };
  }
  if (norm.includes('islamabad')) {
    return {
      country: 'Pakistan',
      stateProvince: 'Islamabad Capital Territory',
      district: 'Islamabad',
      tehsil: 'Islamabad City',
      cityTown: 'Islamabad',
      unionCouncil: 'UC-01 Secretariat'
    };
  }
  if (norm.includes('peshawar')) {
    return {
      country: 'Pakistan',
      stateProvince: 'Khyber Pakhtunkhwa',
      district: 'Peshawar',
      tehsil: 'Peshawar City',
      cityTown: 'Peshawar',
      unionCouncil: 'UC-15 Hayatabad'
    };
  }
  if (norm.includes('quetta')) {
    return {
      country: 'Pakistan',
      stateProvince: 'Balochistan',
      district: 'Quetta',
      tehsil: 'Quetta City',
      cityTown: 'Quetta',
      unionCouncil: 'UC-08 Zarghoon'
    };
  }
  if (norm.includes('multan')) {
    return {
      country: 'Pakistan',
      stateProvince: 'Punjab',
      district: 'Multan',
      tehsil: 'Multan City',
      cityTown: 'Multan',
      unionCouncil: 'UC-33 Gulgasht Colony'
    };
  }
  if (norm.includes('faisalabad')) {
    return {
      country: 'Pakistan',
      stateProvince: 'Punjab',
      district: 'Faisalabad',
      tehsil: 'Faisalabad City',
      cityTown: 'Faisalabad',
      unionCouncil: 'UC-21 D-Ground'
    };
  }

  return {
    country: 'Pakistan',
    stateProvince: 'Punjab',
    district: 'Lahore',
    tehsil: 'Model Town',
    cityTown: 'Lahore',
    unionCouncil: 'UC-01 Central'
  };
}
