export interface LocationOption {
  code: string;
  name: string;
}

export interface DistrictEntry {
  name: string;
  tehsils: string[];
  majorCities: string[];
  sampleUCs: string[];
}

export interface ProvinceData {
  name: string;
  districts: DistrictEntry[];
}

export const COUNTRIES = ['Pakistan'];

export const PROVINCES_DATA: Record<string, ProvinceData> = {
  'Punjab': {
    name: 'Punjab',
    districts: [
      { name: 'Lahore', tehsils: ['Model Town', 'Lahore Cantt', 'Lahore City', 'Shalimar', 'Raiwind', 'Allama Iqbal Town'], majorCities: ['Lahore', 'Raiwind', 'Shahdara', 'Kahna Nau'], sampleUCs: ['UC-112 Model Town', 'UC-119 Cavalry Ground', 'UC-95 Gulberg III', 'UC-108 Johar Town', 'UC-74 Shadman', 'UC-132 DHA Phase 5'] },
      { name: 'Faisalabad', tehsils: ['Faisalabad City', 'Faisalabad Saddar', 'Jaranwala', 'Samundri', 'Tandlianwala', 'Chak Jhumra'], majorCities: ['Faisalabad', 'Jaranwala', 'Samundri', 'Tandlianwala', 'Chak Jhumra', 'Khurrianwala'], sampleUCs: ['UC-21 D-Ground', 'UC-14 Madina Town', 'UC-08 Ghulam Muhammad Abad', 'UC-33 Peoples Colony'] },
      { name: 'Rawalpindi', tehsils: ['Rawalpindi', 'Gujar Khan', 'Kahuta', 'Kallar Syedan', 'Taxila'], majorCities: ['Rawalpindi', 'Gujar Khan', 'Taxila', 'Wah Cantt', 'Kahuta', 'Kallar Syedan'], sampleUCs: ['UC-41 Satellite Town', 'UC-12 Saddar', 'UC-28 Westridge', 'UC-55 Bahria Town'] },
      { name: 'Murree', tehsils: ['Murree', 'Kotli Sattian'], majorCities: ['Murree', 'Kotli Sattian', 'Bhurban'], sampleUCs: ['UC-01 Mall Road', 'UC-03 Gharial'] },
      { name: 'Multan', tehsils: ['Multan City', 'Multan Saddar', 'Shujabad', 'Jalalpur Pirwala'], majorCities: ['Multan', 'Shujabad', 'Jalalpur Pirwala', 'Makhdoom Rashid'], sampleUCs: ['UC-33 Gulgasht Colony', 'UC-19 Cantt', 'UC-05 Shah Rukn-e-Alam', 'UC-42 Bosan Road'] },
      { name: 'Gujranwala', tehsils: ['Gujranwala City', 'Gujranwala Saddar', 'Kamoke', 'Nowshera Virkan'], majorCities: ['Gujranwala', 'Kamoke', 'Nowshera Virkan', 'Eminabad', 'Qila Didar Singh'], sampleUCs: ['UC-18 Model Town', 'UC-09 Satellite Town', 'UC-25 DC Colony', 'UC-44 Cantt'] },
      { name: 'Wazirabad', tehsils: ['Wazirabad', 'Alipur Chattha'], majorCities: ['Wazirabad', 'Alipur Chattha', 'Ghakhar Mandi', 'Sohdra'], sampleUCs: ['UC-01 Central Wazirabad', 'UC-04 Ghakhar'] },
      { name: 'Sialkot', tehsils: ['Sialkot', 'Daska', 'Pasrur', 'Sambrial'], majorCities: ['Sialkot', 'Daska', 'Pasrur', 'Sambrial', 'Chawinda'], sampleUCs: ['UC-06 Cantt', 'UC-15 Model Town', 'UC-29 Paris Road', 'UC-38 Small Industries Estate'] },
      { name: 'Bahawalpur', tehsils: ['Bahawalpur City', 'Bahawalpur Saddar', 'Ahmadpur East', 'Hasilpur', 'Khairpur Tamewali', 'Yazman'], majorCities: ['Bahawalpur', 'Ahmadpur East', 'Hasilpur', 'Yazman', 'Khairpur Tamewali', 'Uch Sharif'], sampleUCs: ['UC-01 Model Town A', 'UC-05 Satellite Town', 'UC-10 Baghdad-ul-Jadid'] },
      { name: 'Sargodha', tehsils: ['Sargodha', 'Bhalwal', 'Bhera', 'Kot Momin', 'Sahiwal', 'Shahpur', 'Sillanwali'], majorCities: ['Sargodha', 'Bhalwal', 'Bhera', 'Kot Momin', 'Shahpur', 'Sillanwali'], sampleUCs: ['UC-01 Satellite Town', 'UC-04 University Road', 'UC-09 Civil Lines'] },
      { name: 'Mandi Bahauddin', tehsils: ['Mandi Bahauddin', 'Malakwal', 'Phalia'], majorCities: ['Mandi Bahauddin', 'Malakwal', 'Phalia', 'Qadirabad'], sampleUCs: ['UC-01 Civil Lines', 'UC-04 Railway Road'] },
      { name: 'Gujrat', tehsils: ['Gujrat', 'Kharian', 'Sarai Alamgir', 'Jalalpur Jattan'], majorCities: ['Gujrat', 'Kharian', 'Lalamusa', 'Sarai Alamgir', 'Jalalpur Jattan', 'Dinga'], sampleUCs: ['UC-01 Fawara Chowk', 'UC-06 Model Town'] },
      { name: 'Jhelum', tehsils: ['Jhelum', 'Dina', 'Pind Dadan Khan', 'Sohawa'], majorCities: ['Jhelum', 'Dina', 'Pind Dadan Khan', 'Sohawa', 'Khewra'], sampleUCs: ['UC-01 Civil Lines', 'UC-05 Kala Gujran'] },
      { name: 'Chakwal', tehsils: ['Chakwal', 'Choa Saidan Shah', 'Kallar Kahar'], majorCities: ['Chakwal', 'Choa Saidan Shah', 'Kallar Kahar', 'Bhaun'], sampleUCs: ['UC-01 Dhudial', 'UC-03 Sargodha Road'] },
      { name: 'Talagang', tehsils: ['Talagang', 'Lawa'], majorCities: ['Talagang', 'Lawa', 'Tamman'], sampleUCs: ['UC-01 Talagang City'] },
      { name: 'Attock', tehsils: ['Attock', 'Fateh Jang', 'Hasan Abdal', 'Hazro', 'Jand', 'Pindi Gheb'], majorCities: ['Attock', 'Kamra', 'Fateh Jang', 'Hasan Abdal', 'Hazro', 'Jand', 'Pindi Gheb'], sampleUCs: ['UC-01 Civil Bazaar', 'UC-04 Kamra Cantt'] },
      { name: 'Sheikhupura', tehsils: ['Sheikhupura', 'Ferozewala', 'Muridke', 'Sharakpur', 'Safdarabad'], majorCities: ['Sheikhupura', 'Muridke', 'Ferozewala', 'Sharakpur', 'Farooqabad', 'Safdarabad'], sampleUCs: ['UC-01 Civil Lines', 'UC-05 Housing Colony'] },
      { name: 'Nankana Sahib', tehsils: ['Nankana Sahib', 'Sangla Hill', 'Shahkot'], majorCities: ['Nankana Sahib', 'Sangla Hill', 'Shahkot', 'Warburton'], sampleUCs: ['UC-01 Central Nankana'] },
      { name: 'Kasur', tehsils: ['Kasur', 'Chunian', 'Kot Radha Kishan', 'Pattoki'], majorCities: ['Kasur', 'Pattoki', 'Chunian', 'Kot Radha Kishan', 'Phool Nagar', 'Khudian'], sampleUCs: ['UC-01 Shahbaz Khan Road', 'UC-04 Steel Bagh'] },
      { name: 'Okara', tehsils: ['Okara', 'Depalpur', 'Renala Khurd'], majorCities: ['Okara', 'Depalpur', 'Renala Khurd', 'Haveli Lakha', 'Basirpur', 'Hujra Shah Muqeem'], sampleUCs: ['UC-01 Model Town', 'UC-03 Tehsil Road'] },
      { name: 'Sahiwal', tehsils: ['Sahiwal', 'Chichawatni'], majorCities: ['Sahiwal', 'Chichawatni', 'Harappa', 'Kassowal'], sampleUCs: ['UC-01 Farid Town', 'UC-04 Shadman Town'] },
      { name: 'Pakpattan', tehsils: ['Pakpattan', 'Arifwala'], majorCities: ['Pakpattan', 'Arifwala', 'Qaboola'], sampleUCs: ['UC-01 Baba Farid', 'UC-03 Arifwala'] },
      { name: 'Vehari', tehsils: ['Vehari', 'Burewala', 'Mailsi'], majorCities: ['Vehari', 'Burewala', 'Mailsi', 'Gaggoo Mandi'], sampleUCs: ['UC-01 Peoples Colony', 'UC-04 Burewala'] },
      { name: 'Khanewal', tehsils: ['Khanewal', 'Jahanian', 'Kabirwala', 'Mian Channu'], majorCities: ['Khanewal', 'Mian Channu', 'Kabirwala', 'Jahanian', 'Abdul Hakim', 'Tulamba'], sampleUCs: ['UC-01 Civil Lines', 'UC-04 Mian Channu'] },
      { name: 'Lodhran', tehsils: ['Lodhran', 'Dunyapur', 'Kahror Pacca'], majorCities: ['Lodhran', 'Dunyapur', 'Kahror Pacca'], sampleUCs: ['UC-01 Lodhran City'] },
      { name: 'Bahawalnagar', tehsils: ['Bahawalnagar', 'Chishtian', 'Fort Abbas', 'Haroonabad', 'Minchinabad'], majorCities: ['Bahawalnagar', 'Chishtian', 'Haroonabad', 'Fort Abbas', 'Minchinabad', 'Donga Bonga'], sampleUCs: ['UC-01 Model Town', 'UC-03 Chishtian'] },
      { name: 'Rahim Yar Khan', tehsils: ['Rahim Yar Khan', 'Khanpur', 'Liaquatpur', 'Sadiqabad'], majorCities: ['Rahim Yar Khan', 'Sadiqabad', 'Khanpur', 'Liaquatpur', 'Zahir Pir'], sampleUCs: ['UC-01 Abbasia Town', 'UC-04 Model Town'] },
      { name: 'Muzaffargarh', tehsils: ['Muzaffargarh', 'Alipur', 'Jatoi'], majorCities: ['Muzaffargarh', 'Alipur', 'Jatoi', 'Qasba Gujrat', 'Shehr Sultan'], sampleUCs: ['UC-01 Civil Lines'] },
      { name: 'Kot Addu', tehsils: ['Kot Addu', 'Chowk Sarwar Shaheed'], majorCities: ['Kot Addu', 'Chowk Sarwar Shaheed', 'Sanawan', 'Daira Din Panah'], sampleUCs: ['UC-01 Kot Addu'] },
      { name: 'Layyah', tehsils: ['Layyah', 'Chaubara', 'Karor Lal Esan'], majorCities: ['Layyah', 'Karor Lal Esan', 'Chowk Azam', 'Chaubara', 'Fatehpur'], sampleUCs: ['UC-01 Layyah City'] },
      { name: 'Rajanpur', tehsils: ['Rajanpur', 'Jampur', 'Rojhan'], majorCities: ['Rajanpur', 'Jampur', 'Rojhan', 'Fazilpur', 'Dajal'], sampleUCs: ['UC-01 Rajanpur City'] },
      { name: 'Dera Ghazi Khan', tehsils: ['Dera Ghazi Khan', 'Kot Chutta'], majorCities: ['Dera Ghazi Khan', 'Kot Chutta', 'Sakhi Sarwar'], sampleUCs: ['UC-01 Block Z', 'UC-04 Gaddai'] },
      { name: 'Taunsa', tehsils: ['Taunsa', 'Vehova', 'Koh-e-Suleman'], majorCities: ['Taunsa Sharif', 'Vehova', 'Mangrotha'], sampleUCs: ['UC-01 Taunsa'] },
      { name: 'Bhakkar', tehsils: ['Bhakkar', 'Darya Khan', 'Kalur Kot', 'Mankera'], majorCities: ['Bhakkar', 'Darya Khan', 'Kalur Kot', 'Mankera'], sampleUCs: ['UC-01 Bhakkar'] },
      { name: 'Khushab', tehsils: ['Khushab', 'Noorpur Thal', 'Quaidabad', 'Naushera'], majorCities: ['Jauharabad', 'Khushab', 'Quaidabad', 'Noorpur Thal', 'Mitha Tiwana', 'Hadali'], sampleUCs: ['UC-01 Jauharabad'] },
      { name: 'Mianwali', tehsils: ['Mianwali', 'Isa Khel', 'Piplan'], majorCities: ['Mianwali', 'Isa Khel', 'Kundian', 'Liaqatabad', 'Kamar Mushani', 'Kalabagh'], sampleUCs: ['UC-01 Civil Station'] },
      { name: 'Jhang', tehsils: ['Jhang', '18-Hazari', 'Ahmadpur Sial', 'Shorkot'], majorCities: ['Jhang', 'Shorkot', 'Ahmadpur Sial', '18-Hazari', 'Garh Maharaja'], sampleUCs: ['UC-01 Satellite Town'] },
      { name: 'Chiniot', tehsils: ['Chiniot', 'Bhawana', 'Lalian'], majorCities: ['Chiniot', 'Bhawana', 'Lalian', 'Chenab Nagar'], sampleUCs: ['UC-01 Mohalla Garha'] },
      { name: 'Toba Tek Singh', tehsils: ['Toba Tek Singh', 'Gojra', 'Kamalia', 'Pirmahal'], majorCities: ['Toba Tek Singh', 'Gojra', 'Kamalia', 'Pirmahal'], sampleUCs: ['UC-01 Toba City'] },
      { name: 'Hafizabad', tehsils: ['Hafizabad', 'Pindi Bhattian'], majorCities: ['Hafizabad', 'Pindi Bhattian', 'Sukheki Mandi', 'Kaleki Mandi'], sampleUCs: ['UC-01 Hafizabad'] },
      { name: 'Narowal', tehsils: ['Narowal', 'Shakargarh', 'Zafarwal'], majorCities: ['Narowal', 'Shakargarh', 'Zafarwal', 'Baddomalhi'], sampleUCs: ['UC-01 Narowal'] }
    ]
  },
  'Sindh': {
    name: 'Sindh',
    districts: [
      { name: 'Karachi South', tehsils: ['Saddar', 'Civil Lines', 'Aram Bagh', 'Garden', 'Lyari'], majorCities: ['Karachi', 'Clifton', 'DHA Karachi', 'Lyari', 'Saddar'], sampleUCs: ['UC-45 Clifton / DHA', 'UC-42 Clifton Block 2', 'UC-11 Saddar Bazaar'] },
      { name: 'Karachi Central', tehsils: ['North Nazimabad', 'Gulberg', 'Liaquatabad', 'New Karachi'], majorCities: ['North Nazimabad', 'Liaquatabad', 'New Karachi', 'Federal B Area'], sampleUCs: ['UC-05 North Nazimabad', 'UC-18 Federal B Area'] },
      { name: 'Karachi East', tehsils: ['Gulshan-e-Iqbal', 'Jamshed Quarters', 'Ferozabad'], majorCities: ['Gulshan-e-Iqbal', 'Gulistan-e-Johar', 'Bahadurabad', 'PECHS'], sampleUCs: ['UC-14 Gulshan Block 13', 'UC-22 Bahadurabad'] },
      { name: 'Karachi West', tehsils: ['Orangi Town', 'SITE', 'Manghopir', 'Mominabad'], majorCities: ['Orangi Town', 'Manghopir', 'Baldia'], sampleUCs: ['UC-01 Orangi'] },
      { name: 'Korangi', tehsils: ['Korangi', 'Landhi', 'Shah Faisal Colony', 'Model Colony'], majorCities: ['Korangi', 'Landhi', 'Shah Faisal Colony'], sampleUCs: ['UC-01 Korangi No. 4'] },
      { name: 'Malir', tehsils: ['Malir', 'Bin Qasim', 'Gadap', 'Ibrahim Hyderi', 'Murad Memon'], majorCities: ['Malir', 'Airport', 'Bin Qasim', 'Gadap'], sampleUCs: ['UC-01 Malir City'] },
      { name: 'Keamari', tehsils: ['Keamari', 'Baldia', 'Mauripur', 'SITE'], majorCities: ['Keamari', 'Baldia Town', 'Mauripur', 'Hawkesbay'], sampleUCs: ['UC-01 Keamari'] },
      { name: 'Hyderabad', tehsils: ['Hyderabad City', 'Latifabad', 'Qasimabad', 'Hyderabad Rural'], majorCities: ['Hyderabad', 'Latifabad', 'Qasimabad', 'Tando Jam', 'Hussainabad'], sampleUCs: ['UC-08 Latifabad Unit 7', 'UC-12 Qasimabad Phase 1'] },
      { name: 'Sukkur', tehsils: ['Sukkur City', 'New Sukkur', 'Rohri', 'Pano Aqil', 'Salehpat'], majorCities: ['Sukkur', 'Rohri', 'Pano Aqil', 'Salehpat'], sampleUCs: ['UC-04 Military Road', 'UC-09 Barrage Colony'] },
      { name: 'Larkana', tehsils: ['Larkana', 'Bakrani', 'Dokri', 'Ratodero'], majorCities: ['Larkana', 'Ratodero', 'Dokri', 'Naudero', 'Badah'], sampleUCs: ['UC-01 Dari Mohalla'] },
      { name: 'Shaheed Benazirabad', tehsils: ['Nawabshah', 'Kazi Ahmed', 'Sakrand', 'Daur'], majorCities: ['Nawabshah', 'Sakrand', 'Kazi Ahmed', 'Daur', 'Bandhi'], sampleUCs: ['UC-01 Nawabshah'] },
      { name: 'Mirpurkhas', tehsils: ['Mirpurkhas', 'Digri', 'Hussain Bux Mari', 'Jhudo', 'Kot Ghulam Muhammad', 'Sindhri'], majorCities: ['Mirpurkhas', 'Digri', 'Jhudo', 'Kot Ghulam Muhammad', 'Nauabad'], sampleUCs: ['UC-01 Satellite Town'] },
      { name: 'Jacobabad', tehsils: ['Jacobabad', 'Garhi Khairo', 'Thul'], majorCities: ['Jacobabad', 'Thul', 'Garhi Khairo'], sampleUCs: ['UC-01 Jacobabad'] },
      { name: 'Shikarpur', tehsils: ['Shikarpur', 'Garhi Yasin', 'Khanpur', 'Lakhi'], majorCities: ['Shikarpur', 'Garhi Yasin', 'Lakhi Ghulam Shah', 'Khanpur'], sampleUCs: ['UC-01 Shikarpur'] },
      { name: 'Khairpur', tehsils: ['Khairpur', 'Faiz Ganj', 'Gambat', 'Kingri', 'Kot Diji', 'Mirwah', 'Nara', 'Sobho Dero'], majorCities: ['Khairpur', 'Gambat', 'Ranipur', 'Kot Diji', 'Pir Jo Goth', 'Sobho Dero', 'Thari Mirwah'], sampleUCs: ['UC-01 Luqman'] },
      { name: 'Dadu', tehsils: ['Dadu', 'Johi', 'Khairpur Nathan Shah', 'Mehar'], majorCities: ['Dadu', 'Mehar', 'Johi', 'Khairpur Nathan Shah', 'Sita Road'], sampleUCs: ['UC-01 Dadu City'] },
      { name: 'Thatta', tehsils: ['Thatta', 'Ghorabari', 'Keti Bunder', 'Mirpur Sakro'], majorCities: ['Thatta', 'Makli', 'Mirpur Sakro', 'Gharo', 'Keti Bunder'], sampleUCs: ['UC-01 Makli'] },
      { name: 'Badin', tehsils: ['Badin', 'Golarchi', 'Matli', 'Talhar', 'Tando Bago'], majorCities: ['Badin', 'Matli', 'Golarchi', 'Talhar', 'Tando Bago', 'Nindo Shahar'], sampleUCs: ['UC-01 Badin City'] },
      { name: 'Tharparkar', tehsils: ['Mithi', 'Chachro', 'Dahli', 'Diplo', 'Islamkot', 'Kaloi', 'Nagarparkar'], majorCities: ['Mithi', 'Islamkot', 'Diplo', 'Chachro', 'Nagarparkar'], sampleUCs: ['UC-01 Mithi'] },
      { name: 'Umerkot', tehsils: ['Umerkot', 'Kunri', 'Pithoro', 'Samaro'], majorCities: ['Umerkot', 'Kunri', 'Samaro', 'Pithoro', 'Chhor'], sampleUCs: ['UC-01 Umerkot'] },
      { name: 'Sanghar', tehsils: ['Sanghar', 'Jam Nawaz Ali', 'Khipro', 'Shahdadpur', 'Sinjhoro', 'Tando Adam'], majorCities: ['Sanghar', 'Tando Adam', 'Shahdadpur', 'Khipro', 'Sinjhoro', 'Jhol'], sampleUCs: ['UC-01 Sanghar'] },
      { name: 'Ghotki', tehsils: ['Ghotki', 'Daharki', 'Khangarh', 'Mirpur Mathelo', 'Ubauro'], majorCities: ['Ghotki', 'Mirpur Mathelo', 'Daharki', 'Ubauro', 'Khangarh'], sampleUCs: ['UC-01 Ghotki'] },
      { name: 'Kashmore', tehsils: ['Kandhkot', 'Kashmore', 'Tangwani'], majorCities: ['Kandhkot', 'Kashmore', 'Tangwani', 'Ghouspur'], sampleUCs: ['UC-01 Kandhkot'] },
      { name: 'Qambar Shahdadkot', tehsils: ['Qambar', 'Shahdadkot', 'Mirokhan', 'Nasirabad', 'Qubo Saeed Khan', 'Sijawal Junejo', 'Warah'], majorCities: ['Qambar', 'Shahdadkot', 'Warah', 'Mirokhan', 'Nasirabad'], sampleUCs: ['UC-01 Qambar'] },
      { name: 'Jamshoro', tehsils: ['Kotri', 'Manjhand', 'Sehwan', 'Thana Bulla Khan'], majorCities: ['Jamshoro', 'Kotri', 'Sehwan Sharif', 'Nooriabad', 'Manjhand'], sampleUCs: ['UC-01 Kotri'] },
      { name: 'Matiari', tehsils: ['Matiari', 'Hala', 'Saeedabad'], majorCities: ['Matiari', 'Hala', 'Bhit Shah', 'Saeedabad'], sampleUCs: ['UC-01 Matiari'] },
      { name: 'Tando Allahyar', tehsils: ['Tando Allahyar', 'Chamber', 'Jhando Mari'], majorCities: ['Tando Allahyar', 'Chamber', 'Nasarpur'], sampleUCs: ['UC-01 Tando Allahyar'] },
      { name: 'Tando Muhammad Khan', tehsils: ['Tando Muhammad Khan', 'Bulri Shah Karim', 'Tando Ghulam Hyder'], majorCities: ['Tando Muhammad Khan', 'Bulri Shah Karim', 'Tando Ghulam Hyder'], sampleUCs: ['UC-01 TMK City'] },
      { name: 'Sujawal', tehsils: ['Sujawal', 'Jati', 'Kharo Chan', 'Mirpur Bathoro', 'Shah Bunder'], majorCities: ['Sujawal', 'Mirpur Bathoro', 'Jati', 'Chuhar Jamali'], sampleUCs: ['UC-01 Sujawal'] },
      { name: 'Naushahro Feroze', tehsils: ['Naushahro Feroze', 'Bhiria', 'Kandiaro', 'Mehrabpur', 'Moro'], majorCities: ['Moro', 'Naushahro Feroze', 'Kandiaro', 'Bhiria', 'Mehrabpur', 'Padidan'], sampleUCs: ['UC-01 Moro'] }
    ]
  },
  'Khyber Pakhtunkhwa': {
    name: 'Khyber Pakhtunkhwa',
    districts: [
      { name: 'Peshawar', tehsils: ['Peshawar City', 'Shah Alam', 'Saddar', 'Badaber', 'Chamkani', 'Mathra'], majorCities: ['Peshawar', 'Hayatabad', 'University Town', 'Chamkani'], sampleUCs: ['UC-15 Hayatabad', 'UC-08 University Town', 'UC-22 Cantt'] },
      { name: 'Mardan', tehsils: ['Mardan', 'Takht Bhai', 'Katlang', 'Rustam', 'Garhi Kapura'], majorCities: ['Mardan', 'Takht Bhai', 'Katlang', 'Rustam', 'Shergarh'], sampleUCs: ['UC-03 Cantt', 'UC-09 Baghdada'] },
      { name: 'Swat', tehsils: ['Babuzai', 'Matta', 'Khwazakhela', 'Barikot', 'Kabal', 'Charbagh', 'Bahrain'], majorCities: ['Mingora', 'Saidu Sharif', 'Barikot', 'Matta', 'Khwazakhela', 'Kalam', 'Bahrain'], sampleUCs: ['UC-01 Mingora City', 'UC-06 Saidu Sharif'] },
      { name: 'Abbottabad', tehsils: ['Abbottabad', 'Havelian', 'Lora', 'Lower Tanawal'], majorCities: ['Abbottabad', 'Havelian', 'Nathiagali', 'Ayubia'], sampleUCs: ['UC-02 Mandian', 'UC-07 Supply Bazaar'] },
      { name: 'Mansehra', tehsils: ['Mansehra', 'Balakot', 'Oghi', 'Baffa Pakhal', 'Darband'], majorCities: ['Mansehra', 'Balakot', 'Oghi', 'Shinkiari', 'Naran', 'Kaghan'], sampleUCs: ['UC-01 Ghazikot'] },
      { name: 'Kohat', tehsils: ['Kohat', 'Lachi', 'Gumbat', 'Dara Adam Khel'], majorCities: ['Kohat', 'Lachi', 'Usterzai', 'Dara Adam Khel'], sampleUCs: ['UC-01 Kohat Cantt'] },
      { name: 'Bannu', tehsils: ['Bannu', 'Domel', 'Kakki', 'Miryan', 'Baka Khel'], majorCities: ['Bannu', 'Domel', 'Ghoriwala'], sampleUCs: ['UC-01 Bannu City'] },
      { name: 'Dera Ismail Khan', tehsils: ['Dera Ismail Khan', 'Daraban', 'Kulachi', 'Paharpur', 'Paroa'], majorCities: ['Dera Ismail Khan', 'Paharpur', 'Kulachi', 'Paroa', 'Daraban'], sampleUCs: ['UC-01 D.I. Khan'] },
      { name: 'Swabi', tehsils: ['Swabi', 'Lahor', 'Razar', 'Topi'], majorCities: ['Swabi', 'Topi', 'Chota Lahor', 'Zaida', 'Tordher'], sampleUCs: ['UC-01 Swabi'] },
      { name: 'Charsadda', tehsils: ['Charsadda', 'Shabqadar', 'Tangi'], majorCities: ['Charsadda', 'Shabqadar', 'Tangi', 'Utmanzai'], sampleUCs: ['UC-01 Charsadda'] },
      { name: 'Nowshera', tehsils: ['Nowshera', 'Jehangira', 'Pabbi'], majorCities: ['Nowshera', 'Pabbi', 'Akora Khattak', 'Risalpur', 'Jehangira'], sampleUCs: ['UC-01 Nowshera Cantt'] },
      { name: 'Haripur', tehsils: ['Haripur', 'Ghazi', 'Khanpur'], majorCities: ['Haripur', 'Hattar', 'Khalabat', 'Ghazi', 'Khanpur'], sampleUCs: ['UC-01 Haripur'] },
      { name: 'Dir Upper', tehsils: ['Dir', 'Barawal', 'Kalkot', 'Lar Jam', 'Sharingal', 'Wari'], majorCities: ['Dir', 'Wari', 'Sharingal', 'Kumrat'], sampleUCs: ['UC-01 Dir Khas'] },
      { name: 'Dir Lower', tehsils: ['Timergara', 'Adenzai', 'Balambat', 'Khall', 'Lal Qila', 'Munda', 'Samar Bagh'], majorCities: ['Timergara', 'Chakdara', 'Samar Bagh', 'Munda', 'Talash'], sampleUCs: ['UC-01 Timergara'] },
      { name: 'Chitral Upper', tehsils: ['Mastuj', 'Mulkhow', 'Torkhow'], majorCities: ['Booni', 'Mastuj'], sampleUCs: ['UC-01 Booni'] },
      { name: 'Chitral Lower', tehsils: ['Chitral', 'Drosh'], majorCities: ['Chitral', 'Drosh', 'Ayun', 'Garam Chashma'], sampleUCs: ['UC-01 Chitral'] },
      { name: 'Buner', tehsils: ['Daggar', 'Chagharzai', 'Gadezai', 'Gagra', 'Khudu Khel', 'Mandanr'], majorCities: ['Daggar', 'Pir Baba', 'Totalai', 'Sawari'], sampleUCs: ['UC-01 Daggar'] },
      { name: 'Shangla', tehsils: ['Alpuri', 'Bisham', 'Chakesar', 'Martung', 'Makhuzai', 'Puran'], majorCities: ['Alpuri', 'Bisham', 'Chakesar', 'Karora'], sampleUCs: ['UC-01 Alpuri'] },
      { name: 'Battagram', tehsils: ['Battagram', 'Allai'], majorCities: ['Battagram', 'Thakot', 'Banna'], sampleUCs: ['UC-01 Battagram'] },
      { name: 'Kohistan Upper', tehsils: ['Dassu', 'Harban', 'Kandia', 'Seo'], majorCities: ['Dassu', 'Komila'], sampleUCs: ['UC-01 Dassu'] },
      { name: 'Kohistan Lower', tehsils: ['Pattan', 'Bankad', 'Ranolia'], majorCities: ['Pattan', 'Dubair'], sampleUCs: ['UC-01 Pattan'] },
      { name: 'Kolai-Palas', tehsils: ['Palas', 'Bataira'], majorCities: ['Palas', 'Shalakai'], sampleUCs: ['UC-01 Palas'] },
      { name: 'Torghar', tehsils: ['Judba', 'Khander'], majorCities: ['Judba', 'Thakot Road'], sampleUCs: ['UC-01 Judba'] },
      { name: 'Karak', tehsils: ['Karak', 'Banda Daud Shah', 'Takht-e-Nasrati'], majorCities: ['Karak', 'Takht-e-Nasrati', 'Banda Daud Shah'], sampleUCs: ['UC-01 Karak'] },
      { name: 'Lakki Marwat', tehsils: ['Lakki Marwat', 'Bettani', 'Ghaznikhel', 'Naurang'], majorCities: ['Lakki Marwat', 'Serai Naurang', 'Tajori'], sampleUCs: ['UC-01 Lakki'] },
      { name: 'Tank', tehsils: ['Tank', 'Jandola'], majorCities: ['Tank', 'Jandola'], sampleUCs: ['UC-01 Tank'] },
      { name: 'Hangu', tehsils: ['Hangu', 'Tall'], majorCities: ['Hangu', 'Thall', 'Doaba'], sampleUCs: ['UC-01 Hangu'] },
      { name: 'Kurram', tehsils: ['Parachinar', 'Lower Kurram', 'Central Kurram'], majorCities: ['Parachinar', 'Sadda', 'Alizai'], sampleUCs: ['UC-01 Parachinar'] },
      { name: 'Orakzai', tehsils: ['Central Orakzai', 'Lower Orakzai', 'Upper Orakzai', 'Ismailzai'], majorCities: ['Kalaya', 'Ghaziabad', 'Dabori'], sampleUCs: ['UC-01 Kalaya'] },
      { name: 'Khyber', tehsils: ['Bara', 'Jamrud', 'Landi Kotal', 'Mula Gori'], majorCities: ['Landi Kotal', 'Jamrud', 'Bara', 'Torkham'], sampleUCs: ['UC-01 Jamrud'] },
      { name: 'Mohmand', tehsils: ['Ambar Utman Khel', 'Halimzai', 'Pindiali', 'Pran Ghar', 'Safi', 'Upper Mohmand', 'Yake Ghund'], majorCities: ['Ghalanai', 'Yake Ghund', 'Ekkaghund'], sampleUCs: ['UC-01 Ghalanai'] },
      { name: 'Bajaur', tehsils: ['Khar', 'Bar Chamarkand', 'Barang', 'Mamund', 'Nawagai', 'Salarzai', 'Utman Khel'], majorCities: ['Khar', 'Inayat Killi', 'Nawagai'], sampleUCs: ['UC-01 Khar'] },
      { name: 'North Waziristan', tehsils: ['Miranshah', 'Datta Khel', 'Dossali', 'Gharyum', 'Ghulam Khan', 'Mir Ali', 'Razmak', 'Spinwam'], majorCities: ['Miranshah', 'Mir Ali', 'Razmak'], sampleUCs: ['UC-01 Miranshah'] },
      { name: 'South Waziristan', tehsils: ['Wana', 'Birmil', 'Ladha', 'Makin', 'Sararogha', 'Sarwakai', 'Tiarza'], majorCities: ['Wana', 'Tank Road', 'Makeen', 'Ladha'], sampleUCs: ['UC-01 Wana'] },
      { name: 'Malakand', tehsils: ['Batkhela', 'Dargai'], majorCities: ['Batkhela', 'Dargai', 'Thana'], sampleUCs: ['UC-01 Batkhela'] }
    ]
  },
  'Balochistan': {
    name: 'Balochistan',
    districts: [
      { name: 'Quetta', tehsils: ['Quetta City', 'Chiltan', 'Zarghoon', 'Panjpai', 'Sadar'], majorCities: ['Quetta', 'Hanna', 'Sariab'], sampleUCs: ['UC-08 Zarghoon Road', 'UC-14 Jinnah Town'] },
      { name: 'Gwadar', tehsils: ['Gwadar', 'Pasni', 'Ormara', 'Jiwani', 'Suntsar'], majorCities: ['Gwadar', 'Pasni', 'Ormara', 'Jiwani'], sampleUCs: ['UC-01 Port & Marine Drive'] },
      { name: 'Kech (Turbat)', tehsils: ['Turbat', 'Buleda', 'Dasht', 'Mand', 'Tump', 'Zamuran'], majorCities: ['Turbat', 'Tump', 'Mand', 'Hoshab'], sampleUCs: ['UC-01 Turbat City'] },
      { name: 'Khuzdar', tehsils: ['Khuzdar', 'Zehri', 'Nal', 'Wadh', 'Mula', 'Ornach'], majorCities: ['Khuzdar', 'Wadh', 'Nal', 'Zehri'], sampleUCs: ['UC-02 Central City'] },
      { name: 'Chaman', tehsils: ['Chaman', 'Sadar Chaman'], majorCities: ['Chaman'], sampleUCs: ['UC-01 Chaman'] },
      { name: 'Hub', tehsils: ['Hub', 'Dureji', 'Gadani', 'Sonmiani', 'Sakran'], majorCities: ['Hub', 'Gadani', 'Winder'], sampleUCs: ['UC-01 Hub'] },
      { name: 'Lasbela', tehsils: ['Uthal', 'Bela', 'Lakhra', 'Liari'], majorCities: ['Uthal', 'Bela'], sampleUCs: ['UC-01 Uthal'] },
      { name: 'Sibi', tehsils: ['Sibi', 'Kutmandai', 'Lehri', 'Sangan'], majorCities: ['Sibi', 'Lehri'], sampleUCs: ['UC-01 Sibi'] },
      { name: 'Zhob', tehsils: ['Zhob', 'Qamar Din Karez', 'Ashwat', 'Kashatu', 'Sambaza'], majorCities: ['Zhob'], sampleUCs: ['UC-01 Zhob'] },
      { name: 'Loralai', tehsils: ['Loralai', 'Bori', 'Mekhtar'], majorCities: ['Loralai', 'Mekhtar'], sampleUCs: ['UC-01 Loralai'] },
      { name: 'Pishin', tehsils: ['Pishin', 'Barshore', 'Hurramzai', 'Karezate', 'Saranan'], majorCities: ['Pishin', 'Khanozai', 'Hurramzai'], sampleUCs: ['UC-01 Pishin'] },
      { name: 'Killa Abdullah', tehsils: ['Killa Abdullah', 'Dobandi', 'Gulistan'], majorCities: ['Killa Abdullah', 'Gulistan', 'Jungle Pir Alizai'], sampleUCs: ['UC-01 Gulistan'] },
      { name: 'Killa Saifullah', tehsils: ['Killa Saifullah', 'Loiband', 'Muslim Bagh'], majorCities: ['Killa Saifullah', 'Muslim Bagh'], sampleUCs: ['UC-01 Killa Saifullah'] },
      { name: 'Mastung', tehsils: ['Mastung', 'Dasht', 'Khad Koocha', 'Kirdgap'], majorCities: ['Mastung', 'Dasht'], sampleUCs: ['UC-01 Mastung'] },
      { name: 'Kalat', tehsils: ['Kalat', 'Mangochar', 'Gazg', 'Johan'], majorCities: ['Kalat', 'Mangochar'], sampleUCs: ['UC-01 Kalat'] },
      { name: 'Surab', tehsils: ['Surab'], majorCities: ['Surab'], sampleUCs: ['UC-01 Surab'] },
      { name: 'Nushki', tehsils: ['Nushki', 'Dak'], majorCities: ['Nushki'], sampleUCs: ['UC-01 Nushki'] },
      { name: 'Chagai', tehsils: ['Dalbandin', 'Chagai', 'Nok Kundi', 'Taftan'], majorCities: ['Dalbandin', 'Nok Kundi', 'Taftan', 'Chagai'], sampleUCs: ['UC-01 Dalbandin'] },
      { name: 'Panjgur', tehsils: ['Panjgur', 'Gowargo', 'Gichk', 'Paroom'], majorCities: ['Panjgur', 'Chitkan'], sampleUCs: ['UC-01 Panjgur'] },
      { name: 'Awaran', tehsils: ['Awaran', 'Gishkaur', 'Jhal Jhao', 'Korak Jahoo', 'Mashkay'], majorCities: ['Awaran', 'Mashkay'], sampleUCs: ['UC-01 Awaran'] },
      { name: 'Washuk', tehsils: ['Washuk', 'Besima', 'Mashkel', 'Nag', 'Shahgori'], majorCities: ['Washuk', 'Basima', 'Mashkel'], sampleUCs: ['UC-01 Washuk'] },
      { name: 'Kharan', tehsils: ['Kharan', 'Sar-Kharan', 'Tohmulk'], majorCities: ['Kharan'], sampleUCs: ['UC-01 Kharan'] },
      { name: 'Nasirabad', tehsils: ['Dera Murad Jamali', 'Baba Kot', 'Chattar', 'Tamboo'], majorCities: ['Dera Murad Jamali', 'Tamboo', 'Chattar'], sampleUCs: ['UC-01 DMJ'] },
      { name: 'Jaffarabad', tehsils: ['Jhatpat', 'Gandakha'], majorCities: ['Dera Allah Yar', 'Jhatpat'], sampleUCs: ['UC-01 Dera Allah Yar'] },
      { name: 'Sohbatpur', tehsils: ['Sohbatpur', 'Faridabad', 'Manjhipur', 'Sanhari'], majorCities: ['Sohbatpur', 'Manjhipur'], sampleUCs: ['UC-01 Sohbatpur'] },
      { name: 'Usta Muhammad', tehsils: ['Usta Muhammad', 'Gandakha'], majorCities: ['Usta Muhammad'], sampleUCs: ['UC-01 Usta Muhammad'] },
      { name: 'Jhal Magsi', tehsils: ['Gandawa', 'Jhal Magsi', 'Mirpur'], majorCities: ['Gandawa', 'Jhal Magsi'], sampleUCs: ['UC-01 Gandawa'] },
      { name: 'Kachhi (Bolan)', tehsils: ['Dhadar', 'Balanari', 'Bhag', 'Khattan', 'Mach', 'Sanni'], majorCities: ['Dhadar', 'Bhag', 'Mach'], sampleUCs: ['UC-01 Dhadar'] },
      { name: 'Dera Bugti', tehsils: ['Dera Bugti', 'Phelawagh', 'Sui'], majorCities: ['Dera Bugti', 'Sui'], sampleUCs: ['UC-01 Sui'] },
      { name: 'Kohlu', tehsils: ['Kohlu', 'Kahan', 'Mawand', 'Tamboo'], majorCities: ['Kohlu', 'Kahan'], sampleUCs: ['UC-01 Kohlu'] },
      { name: 'Barkhan', tehsils: ['Barkhan'], majorCities: ['Barkhan', 'Rakhni'], sampleUCs: ['UC-01 Barkhan'] },
      { name: 'Musakhel', tehsils: ['Musakhel', 'Drug', 'Kingri'], majorCities: ['Musakhel', 'Kingri'], sampleUCs: ['UC-01 Musakhel'] },
      { name: 'Sherani', tehsils: ['Sherani'], majorCities: ['Sherani', 'Dhanasar'], sampleUCs: ['UC-01 Sherani'] },
      { name: 'Ziarat', tehsils: ['Ziarat', 'Sinjavi'], majorCities: ['Ziarat', 'Sinjavi'], sampleUCs: ['UC-01 Ziarat'] },
      { name: 'Harnai', tehsils: ['Harnai', 'Shahrig', 'Khoast'], majorCities: ['Harnai', 'Shahrig'], sampleUCs: ['UC-01 Harnai'] },
      { name: 'Duki', tehsils: ['Duki'], majorCities: ['Duki'], sampleUCs: ['UC-01 Duki'] }
    ]
  },
  'Gilgit-Baltistan': {
    name: 'Gilgit-Baltistan',
    districts: [
      { name: 'Gilgit', tehsils: ['Gilgit', 'Danyore', 'Juglot'], majorCities: ['Gilgit', 'Danyore', 'Juglot'], sampleUCs: ['UC-01 Airport Road', 'UC-03 Jutial'] },
      { name: 'Skardu', tehsils: ['Skardu', 'Gultari', 'Rondu'], majorCities: ['Skardu', 'Hussainabad'], sampleUCs: ['UC-01 Yadgar Chowk'] },
      { name: 'Hunza', tehsils: ['Aliabad', 'Gojal'], majorCities: ['Karimabad', 'Aliabad', 'Sost', 'Gulmit', 'Passu'], sampleUCs: ['UC-01 Karimabad'] },
      { name: 'Nagar', tehsils: ['Nagar I', 'Nagar II'], majorCities: ['Nagar Khas', 'Chalt', 'Sikandarabad'], sampleUCs: ['UC-01 Nagar'] },
      { name: 'Ghizer', tehsils: ['Punial', 'Ishkoman'], majorCities: ['Gahkuch', 'Chatorkhand'], sampleUCs: ['UC-01 Gahkuch'] },
      { name: 'Gupis-Yasin', tehsils: ['Gupis', 'Yasin', 'Phander'], majorCities: ['Gupis', 'Yasin', 'Phander'], sampleUCs: ['UC-01 Gupis'] },
      { name: 'Diamer', tehsils: ['Chilas', 'Darel', 'Tangir'], majorCities: ['Chilas', 'Babusar', 'Buner Das'], sampleUCs: ['UC-01 Chilas'] },
      { name: 'Darel', tehsils: ['Darel'], majorCities: ['Darel'], sampleUCs: ['UC-01 Darel'] },
      { name: 'Tangir', tehsils: ['Tangir'], majorCities: ['Tangir'], sampleUCs: ['UC-01 Tangir'] },
      { name: 'Astore', tehsils: ['Astore', 'Shounter'], majorCities: ['Eidgah', 'Gorikot', 'Rama', 'Minimarg'], sampleUCs: ['UC-01 Eidgah'] },
      { name: 'Ghanche', tehsils: ['Khaplu', 'Mashabrum', 'Chorbat', 'Daghoni'], majorCities: ['Khaplu', 'Siachen Sector'], sampleUCs: ['UC-01 Khaplu'] },
      { name: 'Shigar', tehsils: ['Shigar', 'Braldu'], majorCities: ['Shigar', 'Askole'], sampleUCs: ['UC-01 Shigar'] },
      { name: 'Kharmang', tehsils: ['Kharmang'], majorCities: ['Tolti', 'Kharmang'], sampleUCs: ['UC-01 Tolti'] },
      { name: 'Roundu', tehsils: ['Roundu'], majorCities: ['Dambudas'], sampleUCs: ['UC-01 Dambudas'] }
    ]
  },
  'Azad Jammu & Kashmir': {
    name: 'Azad Jammu & Kashmir',
    districts: [
      { name: 'Muzaffarabad', tehsils: ['Muzaffarabad', 'Pattika / Naseerabad'], majorCities: ['Muzaffarabad', 'Pattika', 'Garhi Dupatta'], sampleUCs: ['UC-01 Secretariat Road', 'UC-04 Domel'] },
      { name: 'Mirpur', tehsils: ['Mirpur', 'Dadyal'], majorCities: ['Mirpur', 'Dadyal', 'Chakswari', 'Islamgarh'], sampleUCs: ['UC-02 Sector F-1'] },
      { name: 'Bhimber', tehsils: ['Bhimber', 'Barnala', 'Samahni'], majorCities: ['Bhimber', 'Barnala', 'Samahni'], sampleUCs: ['UC-01 Bhimber'] },
      { name: 'Kotli', tehsils: ['Kotli', 'Charhoi', 'Fatehpur Thakiala', 'Khuiratta', 'Sehnsa', 'Duliah Jattan'], majorCities: ['Kotli', 'Fatehpur (Nakyal)', 'Khuiratta', 'Sehnsa', 'Charhoi'], sampleUCs: ['UC-01 Kotli'] },
      { name: 'Poonch (Rawalakot)', tehsils: ['Rawalakot', 'Abbaspur', 'Hajira', 'Thorar'], majorCities: ['Rawalakot', 'Hajira', 'Abbaspur', 'Banjosa'], sampleUCs: ['UC-01 Rawalakot'] },
      { name: 'Bagh', tehsils: ['Bagh', 'Dhirkot', 'Harighel'], majorCities: ['Bagh', 'Dhirkot'], sampleUCs: ['UC-01 Bagh'] },
      { name: 'Haveli (Kahuta)', tehsils: ['Haveli', 'Khurshidabad', 'Mumtazabad'], majorCities: ['Forward Kahuta'], sampleUCs: ['UC-01 Forward Kahuta'] },
      { name: 'Sudhanoti (Pallandri)', tehsils: ['Pallandri', 'Baloch', 'Mang', 'Trarkhel'], majorCities: ['Pallandri', 'Trarkhel', 'Baloch'], sampleUCs: ['UC-01 Pallandri'] },
      { name: 'Neelum', tehsils: ['Athmuqam', 'Sharda'], majorCities: ['Athmuqam', 'Sharda', 'Kel', 'Keran'], sampleUCs: ['UC-01 Athmuqam'] },
      { name: 'Jhelum Valley (Hattian Bala)', tehsils: ['Hattian Bala', 'Chikar', 'Leepa'], majorCities: ['Hattian Bala', 'Chakothi', 'Chikar', 'Leepa'], sampleUCs: ['UC-01 Hattian Bala'] }
    ]
  },
  'Islamabad Capital Territory': {
    name: 'Islamabad Capital Territory',
    districts: [
      {
        name: 'Islamabad',
        tehsils: ['Islamabad City', 'Sihala', 'Nilore', 'Tarnol', 'Bara Kahu'],
        majorCities: ['Islamabad', 'Blue Area', 'Bara Kahu', 'Tarnol', 'Sihala', 'Bahria Enclave', 'DHA Islamabad', 'G-11 / G-13', 'F-6 / F-7 / F-8 / F-10', 'I-8 / I-10'],
        sampleUCs: ['UC-01 Secretariat & Red Zone', 'UC-24 Sector G-11', 'UC-19 Sector F-8/F-7', 'UC-30 Sector I-8', 'UC-36 DHA Phase 2', 'UC-15 Blue Area']
      }
    ]
  }
};

export const PROVINCE_OPTIONS = Object.keys(PROVINCES_DATA);

export interface FlatCityEntry {
  province: string;
  district: string;
  city: string;
  tehsil: string;
}

export const ALL_PAKISTAN_CITY_ENTRIES: FlatCityEntry[] = (() => {
  const entries: FlatCityEntry[] = [];
  const seen = new Set<string>();

  Object.entries(PROVINCES_DATA).forEach(([province, pData]) => {
    pData.districts.forEach(d => {
      const candidates = Array.from(new Set([d.name, ...d.majorCities, ...d.tehsils]));
      candidates.forEach(city => {
        const key = `${province}|${d.name}|${city.toLowerCase()}`;
        if (!seen.has(key)) {
          seen.add(key);
          entries.push({
            province,
            district: d.name,
            city,
            tehsil: d.tehsils[0] || d.name
          });
        }
      });
    });
  });

  return entries;
})();

export function searchPakistanCities(query: string): FlatCityEntry[] {
  const q = query.trim().toLowerCase();
  if (!q) return ALL_PAKISTAN_CITY_ENTRIES;
  return ALL_PAKISTAN_CITY_ENTRIES.filter(
    e =>
      e.city.toLowerCase().includes(q) ||
      e.district.toLowerCase().includes(q) ||
      e.province.toLowerCase().includes(q) ||
      e.tehsil.toLowerCase().includes(q)
  );
}

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
  return dData && dData.majorCities && dData.majorCities.length > 0 ? dData.majorCities : [district];
}

export function getAllDistricts(): { province: string; district: string }[] {
  const results: { province: string; district: string }[] = [];
  Object.entries(PROVINCES_DATA).forEach(([prov, data]) => {
    data.districts.forEach(d => {
      results.push({ province: prov, district: d.name });
    });
  });
  return results;
}

export function addCustomDistrict(province: string, districtName: string, majorCity?: string) {
  if (!PROVINCES_DATA[province]) {
    PROVINCES_DATA[province] = { name: province, districts: [] };
  }
  const existing = PROVINCES_DATA[province].districts.find(d => d.name.toLowerCase() === districtName.toLowerCase());
  if (!existing) {
    PROVINCES_DATA[province].districts.push({
      name: districtName,
      tehsils: [`${districtName} City`],
      majorCities: majorCity ? [majorCity] : [districtName],
      sampleUCs: ['UC-01 Central']
    });
  }
}

export interface LocationHierarchyFields {
  country?: string;
  stateProvince?: string;
  district?: string;
  tehsil?: string;
  cityTown?: string;
  unionCouncil?: string;
  region?: string;
}

export function formatFullLocationHierarchy(loc?: LocationHierarchyFields): string {
  if (!loc) return 'Pakistan';
  const parts: string[] = [];
  if (loc.country) parts.push(loc.country);
  if (loc.stateProvince) parts.push(loc.stateProvince);
  if (loc.district) parts.push(loc.district);
  if (loc.tehsil && loc.tehsil !== loc.district) parts.push(`Tehsil ${loc.tehsil}`);
  if (loc.cityTown && loc.cityTown !== loc.district) parts.push(loc.cityTown);
  if (loc.unionCouncil) parts.push(loc.unionCouncil);

  if (parts.length === 0 && loc.region) return loc.region;
  return parts.length > 0 ? parts.join(' → ') : 'Pakistan';
}

export function formatShortLocation(loc?: LocationHierarchyFields): string {
  if (!loc) return 'Unassigned';
  if (loc.cityTown && loc.district && loc.cityTown !== loc.district) {
    return `${loc.cityTown}, ${loc.district}`;
  }
  if (loc.district && loc.stateProvince) {
    return `${loc.district}, ${loc.stateProvince}`;
  }
  if (loc.district) return loc.district;
  if (loc.stateProvince) return loc.stateProvince;
  if (loc.region) return loc.region;
  return loc.country || 'Pakistan';
}

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
    return { country: 'Pakistan', stateProvince: 'Punjab', district: 'Lahore', tehsil: 'Model Town', cityTown: 'Lahore', unionCouncil: 'UC-112 Model Town' };
  }
  if (norm.includes('karachi')) {
    return { country: 'Pakistan', stateProvince: 'Sindh', district: 'Karachi South', tehsil: 'Saddar', cityTown: 'Karachi', unionCouncil: 'UC-45 Clifton / DHA' };
  }
  if (norm.includes('islamabad')) {
    return { country: 'Pakistan', stateProvince: 'Islamabad Capital Territory', district: 'Islamabad', tehsil: 'Islamabad City', cityTown: 'Islamabad', unionCouncil: 'UC-01 Secretariat' };
  }
  if (norm.includes('peshawar')) {
    return { country: 'Pakistan', stateProvince: 'Khyber Pakhtunkhwa', district: 'Peshawar', tehsil: 'Peshawar City', cityTown: 'Peshawar', unionCouncil: 'UC-15 Hayatabad' };
  }
  if (norm.includes('quetta')) {
    return { country: 'Pakistan', stateProvince: 'Balochistan', district: 'Quetta', tehsil: 'Quetta City', cityTown: 'Quetta', unionCouncil: 'UC-08 Zarghoon' };
  }
  if (norm.includes('multan')) {
    return { country: 'Pakistan', stateProvince: 'Punjab', district: 'Multan', tehsil: 'Multan City', cityTown: 'Multan', unionCouncil: 'UC-33 Gulgasht Colony' };
  }
  if (norm.includes('faisalabad')) {
    return { country: 'Pakistan', stateProvince: 'Punjab', district: 'Faisalabad', tehsil: 'Faisalabad City', cityTown: 'Faisalabad', unionCouncil: 'UC-21 D-Ground' };
  }

  return { country: 'Pakistan', stateProvince: 'Punjab', district: 'Lahore', tehsil: 'Model Town', cityTown: 'Lahore', unionCouncil: '' };
}

export const PAKISTAN_LOCATION_DATA = Object.entries(PROVINCES_DATA).map(([stateProvince, pData]) => ({
  stateProvince,
  districts: pData.districts.map(d => ({
    district: d.name,
    tehsils: d.tehsils,
    cities: d.majorCities,
    sampleUCs: d.sampleUCs
  }))
}));
