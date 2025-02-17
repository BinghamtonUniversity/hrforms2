<?php
/*
NB: set $this->reqAuth = false in __construct to allow calls to functions without authentication checks.  Call $this->checkAuth() from functions to selectively restrict access.

NB: HTTP Codes: https://tools.ietf.org/html/rfc7231#section-6
405: Method Not Allowed
501: Not Implemented

NB: HTTP Request Methods: https://tools.ietf.org/html/rfc7231#section-4.3
*/

class PersonInfo extends HRForms2 {
	private $_arr = array();

	function __construct($req,$rjson=true) {
		$this->allowedMethods = "GET"; //default: "" - NB: Add methods here: GET, POST, PUT, PATCH, DELETE
		$this->reqAuth = true; //default: true - NB: See note above
		$this->retJSON = $rjson;
		$this->req = $req;
		$this->init();
	}

	/**
	 * validate called from init()
	 */
	function validate() {
		if (count($this->req) != 2) $this->raiseError(400);
	}

	/* create functions GET,POST,PUT,PATCH,DELETE as needed - defaults provided from init reflection method */
	function GET() {

		switch($this->req[1]) {
			case "information":
				$salutations = (new listdata(array('salutations'),false))->returnData;
				$qry = "select p.hr_person_id, p.suny_id, p.local_campus_id, p.salutation_code, 
					p.legal_first_name, p.alias_first_name,
					p.legal_middle_name, p.legal_last_name, p.suffix_code, 
					i.volunteer_fire_flag, decode(i.retirement_date,null,0,1) as rehire_retiree, 
					i.retirement_date, i.retired_from
				from buhr_person_mv@banner.cc.binghamton.edu p
				left join (select suny_id, volunteer_fire_flag, retirement_date, retired_from from buhr_general_info_mv@banner.cc.binghamton.edu) i on (i.suny_id = p.suny_id)
				where p.hr_person_id = :hr_person_id";
				$stmt = oci_parse($this->db,$qry);
				oci_bind_by_name($stmt,":hr_person_id", $this->req[0]);
				$r = oci_execute($stmt);
				if (!$r) $this->raiseError();
				$row = oci_fetch_array($stmt,OCI_ASSOC+OCI_RETURN_NULLS);

				// Salutation Code and Description Array
				$key = array_search($row['SALUTATION_CODE'],array_column($salutations,0));
				$row['SALUTATION_CODE'] = array("id"=>$row['SALUTATION_CODE'],"label"=>($key!==false)?$salutations[$key][1]:"");
				
				$this->_arr = $this->null2Empty($row);
				oci_free_statement($stmt);

				break;
			case "demographics":
				$legalSex = (new listdata(array('legalSex'),false))->returnData;
				$gender = (new listdata(array('gender'),false))->returnData;
				$education = (new listdata(array('highestEducation'),false))->returnData;
				$countryCodes = (new listdata(array('countryCodes'),false))->returnData;
				$militaryStatus = (new listdata(array('militaryStatus'),false))->returnData;
				$protectedVeteranStatus = (new listdata(array('protectedVeteranStatus'),false))->returnData;
			
				// hispanic_flag, ethnicity_mult_codes, ethnicity_source_dsc, disability_indicator - not currently using
				$qry = "select distinct birth_date, gender, gender_identity, highest_education_level,
					us_citizen_indicator, non_citizen_type, emp_authorize_card_indicator, visa_code, citizenship_country_code, 
					military_status_code, veteran_indicator, protected_vet_status_code, military_separation_date
				from buhr_person_mv@banner.cc.binghamton.edu a
				join (select hr_person_id, max(nvl(role_end_date,sysdate)) as max_end_date from buhr_person_mv@banner.cc.binghamton.edu where role_type <> 'STSCH' group by hr_person_id) b on (a.hr_person_id = b.hr_person_id and nvl(a.role_end_date,sysdate) = b.max_end_date)
				where a.hr_person_id = :hr_person_id
				and role_type <> 'STSCH'";
				$stmt = oci_parse($this->db,$qry);
				oci_bind_by_name($stmt,":hr_person_id", $this->req[0]);
				$r = oci_execute($stmt);
				if (!$r) $this->raiseError();
				$row = oci_fetch_array($stmt,OCI_ASSOC+OCI_RETURN_NULLS);

				// Gender/Legal Sex Code and Description
				$key = array_search($row['GENDER'],array_column($legalSex,0));
				$row['GENDER'] = array("id"=>$row['GENDER'],"label"=>($key!==false)?$legalSex[$key][1]:"");

				// Gender Identity Code and Description
				$key = array_search($row['GENDER_IDENTITY'],array_column($gender,0));
				$row['GENDER_IDENTITY'] = array("id"=>$row['GENDER_IDENTITY'],"label"=>($key!==false)?$gender[$key][1]:"");

				// Highest Education Code and Description
				$fields = array_keys($education[0]);
				$key = array_search($row['HIGHEST_EDUCATION_LEVEL'],array_column($education,$fields[0]));
				$row['HIGHEST_EDUCATION_LEVEL'] = array("id"=>$row['HIGHEST_EDUCATION_LEVEL'],"label"=>($key!==false)?$education[$key][$fields[1]]:"");

				// Country Code
				$fields = array_keys($countryCodes[0]);
				$key = array_search($row['CITIZENSHIP_COUNTRY_CODE'],array_column($countryCodes,$fields[0]));
				$row['CITIZENSHIP_COUNTRY_CODE'] = array("id"=>$row['CITIZENSHIP_COUNTRY_CODE'],label=>($key!==false)?$countryCodes[$key][$fields[1]]:"");

				// Non-US Citizen
				if ($row['US_CITIZEN_INDICATOR'] != 'Y') {
					$nonUsCitizenType = (new listdata(array('nonUsCitizenType'),false))->returnData;
					$visaTypes = (new listdata(array('visaTypes'),false))->returnData;
					// Non-US Citizen Type
					$key = array_search($row['NON_CITIZEN_TYPE'],array_column($nonUsCitizenType,0));
					$row['NON_CITIZEN_TYPE'] = array("id"=>$row['NON_CITIZEN_TYPE'],label=>($key!==false)?$nonUsCitizenType[$key][1]:"");
					// VISA Type
					$key = array_search($row['VISA_CODE'],array_column($visaTypes,0));
					$row['VISA_CODE'] = array("id"=>$row['VISA_CODE'],label=>($key!==false)?$visaTypes[$key][1]:"");
				}

				// Military Status Array
				$row['militaryStatus'] = array();
				if ($row['MILITARY_STATUS_CODE'] == '00000') {
					$key = array_search('N',array_column($militaryStatus,0));
					if ($key) array_push($row['militaryStatus'],$militaryStatus[$key]);
				} else {
					foreach(str_split($row['MILITARY_STATUS_CODE']) as $i=>$v) {
						if ($v == 1) array_push($row['militaryStatus'],$militaryStatus[$i]);
					}
				}

				// Protected Veteran Status
				$row['protectedVetStatus'] = array();
				if ($row['PROTECTED_VET_STATUS_CODE'] == '0000000') {
					$key = array_search('N',array_column($protectedVeteranStatus,0));
					if ($key) array_push($row['protectedVetStatus'],$protectedVeteranStatus[$key]);
				} else {
					foreach(str_split($row['PROTECTED_VET_STATUS_CODE']) as $i=>$v) {
						if ($v == 1) array_push($row['protectedVetStatus'],$protectedVeteranStatus[$i]);
					}
				}

				$this->_arr = $this->null2Empty($row);
				oci_free_statement($stmt);
	
				break;
			
			case "directory":
				$addressCodes = (new listdata(array('addressCodes'),false))->returnData;
				$deptOrgs = (new listdata(array('deptOrgs'),false))->returnData;
				$buildings = (new listdata(array('buildings'),false))->returnData;
				
				// Get Address
				$qry = "select a.address_code, a.address_1, a.address_2, a.address_3, a.address_city, a.state_code, a.address_postal_code, a.create_date 
				from buhr_address_mv@banner.cc.binghamton.edu a
				join (select hr_person_id, suny_id from buhr_person_mv@banner.cc.binghamton.edu where hr_person_id = :hr_person_id) p on (p.suny_id = a.suny_id)";
				$stmt = oci_parse($this->db,$qry);
				oci_bind_by_name($stmt,":hr_person_id", $this->req[0]);
				$r = oci_execute($stmt);
				if (!$r) $this->raiseError();				

				$hasDepartment = array();
				foreach($addressCodes as $ac) {
					if (!$ac->fields) continue;
					if (array_search('department',$ac->fields)!==false) {
						array_push($hasDepartment,$ac->id);
					}
				}

				$hasBuilding = array();
				foreach($addressCodes as $ac) {
					if (!$ac->fields) continue;
					if (array_search('building',$ac->fields)!==false) {
						array_push($hasBuilding,$ac->id);
					}
				}
				
				while($row = oci_fetch_array($stmt,OCI_ASSOC+OCI_RETURN_NULLS)) {
					$row['department'] = array("id"=>"","label"=>"","text"=>"");
					$row['building'] = array("id"=>"","label"=>"","text"=>"");
					if (in_array($row['ADDRESS_CODE'],$hasDepartment)) {
						foreach($deptOrgs as $d) {
							if (strtolower($row['ADDRESS_1']) == strtolower($d['DEPARTMENT_NAME'])) {
								$row['department'] = array("id"=>$d['DEPARTMENT_CODE'],"label"=>$d['DEPARTMENT_NAME']);
								break;
							}
						}
					}
					if (in_array($row['ADDRESS_CODE'],$hasBuilding)) {
						foreach($buildings as list($id,$label)) {
							if (strtolower($row['ADDRESS_2']) == strtolower($label)) {
								$row['building'] = array("id"=>$id,"label"=>$label);
								break;
							}
						}
					}
					$address[] = $row;
				}
				$this->_arr['address'] = $this->null2Empty($address);
				oci_free_statement($stmt);

				// Get Phone
				$qry = "select a.phone_type, '+' || nvl(a.international_phone_number,'1' || a.phone_area_code || a.phone_exchange || a.phone_number) as phone_number,
						a.cell_indicator, a.create_date
						from buhr_phone_mv@banner.cc.binghamton.edu a
						join (select hr_person_id, suny_id from buhr_person_mv@banner.cc.binghamton.edu where hr_person_id = :hr_person_id) p on (p.suny_id = a.suny_id)";
				$stmt = oci_parse($this->db,$qry);
				oci_bind_by_name($stmt,":hr_person_id", $this->req[0]);
				$r = oci_execute($stmt);
				if (!$r) $this->raiseError();
				oci_fetch_all($stmt,$phone,null,null,OCI_FETCHSTATEMENT_BY_ROW);
				$this->_arr['phone'] = $this->null2Empty($phone);
				oci_free_statement($stmt);

				// Get Email
				$qry = "select email_type, email_address, create_date
						from buhr_email_mv@banner.cc.binghamton.edu a
						join (select hr_person_id, suny_id from buhr_person_mv@banner.cc.binghamton.edu where hr_person_id = :hr_person_id) p on (p.suny_id = a.suny_id)";
				$stmt = oci_parse($this->db,$qry);
				oci_bind_by_name($stmt,":hr_person_id", $this->req[0]);
				$r = oci_execute($stmt);
				if (!$r) $this->raiseError();
				oci_fetch_all($stmt,$email,null,null,OCI_FETCHSTATEMENT_BY_ROW);
				$this->_arr['email'] = $this->null2Empty($email);
				oci_free_statement($stmt);

				break;
			case "education":
				$degreeTypes = (new listdata(array('degreeTypes'),false))->returnData;
				$degreePrograms = (new listdata(array('degreePrograms'),false))->returnData;
				$countryCodes = (new listdata(array('countryCodes'),false))->returnData;

				$qry = "select e.degree_year, e.degree_month, e.pending_degree_flag, e.degree_type,
				e.degree_program_code, e.degree_program_description,
				i.country_code, i.institution_state, i.institution_city, i.institution_id, i.institution, 
				e.highest_degree_flag, e.terminal_degree_flag, e.degree_verified, e.create_date
				from BUHR.BUHR_POST_SECONDARY_MV@banner.cc.binghamton.edu e
				left join (select to_char(i.unt_id) as institution_id, 'USA' as country_code, i.institution_state, i.institution_city, i.institution
					from sunyhr.degree_institutions@banner.cc.binghamton.edu i
					union
					select 'F' || f.fgn_dgr_instn_id, f.country_code, null, null, f.institution
					from sunyhr.foreign_degree_institutions@banner.cc.binghamton.edu f) i on (i.institution_id = nvl(e.unit_id,'F'||e.foreign_degree_instn_id))
				join (select hr_person_id, suny_id from buhr_person_mv@banner.cc.binghamton.edu where hr_person_id = :hr_person_id) p on (p.suny_id = e.suny_id)";
				$stmt = oci_parse($this->db,$qry);
				oci_bind_by_name($stmt,":hr_person_id", $this->req[0]);
				$r = oci_execute($stmt);
				if (!$r) $this->raiseError();
				while($row = oci_fetch_array($stmt,OCI_ASSOC+OCI_RETURN_NULLS)) {
					//Degree Type
					$key = array_search($row['DEGREE_TYPE'],array_column($degreeTypes,'DEGREE_TYPE_CODE'));
					$row['DEGREE_TYPE'] = array(array("id"=>$row['DEGREE_TYPE'],"label"=>($key!==false)?$degreeTypes[$key]['DEGREE_TYPE_DESC']:""));
					//Degree Program
					$key = array_search($row['DEGREE_PROGRAM_CODE'],array_column($degreePrograms,'DEGREE_PGM_CODE'));
					$row['DEGREE_PROGRAM'] = array(array("id"=>$row['DEGREE_PROGRAM_CODE'],"label"=>($key!==false)?$degreePrograms[$key]['DEGREE_PGM_DESC']:""));
					unset($row['DEGREE_PROGRAM_CODE']);
					unset($row['DEGREE_PROGRAM_DESCRIPTION']);
					//Country Code
					$key = array_search($row['COUNTRY_CODE'],array_column($countryCodes,'COUNTRY_CODE'));
					$row['COUNTRY_CODE'] = array("id"=>$row['COUNTRY_CODE'],"label"=>($key!==false)?$countryCodes[$key]['COUNTRY_SHORT_DESC']:"");
					$this->_arr[] = $row;
				}
				$this->_arr = $this->null2Empty($this->_arr);
				oci_free_statement($stmt);

				break;
			case "contact":
				$relationships = (new listdata(array('contactRelationships'),false))->returnData;
				$countryCodes = (new listdata(array('countryCodes'),false))->returnData;

				$qry = "select emr_ctc_rank,
					emr_ctc_first_name, emr_ctc_last_name, emr_ctc_address_1, emr_ctc_address_2,
					emr_ctc_city, emr_ctc_state_code, emr_ctc_zip, emr_ctc_country_code, emr_ctc_day_phone,
					emr_ctc_night_phone, emr_ctc_cell_phone, emr_ctc_international_phone, emr_ctc_email,
					emr_ctc_relationship, create_date
				from  BUHR.BUHR_EMERGENCY_CONTACT_MV@banner.cc.binghamton.edu e
				join (select hr_person_id, suny_id from buhr_person_mv@banner.cc.binghamton.edu where hr_person_id = :hr_person_id) p on (p.suny_id = e.suny_id)
				order by emr_ctc_rank";
				$stmt = oci_parse($this->db,$qry);
				oci_bind_by_name($stmt,":hr_person_id", $this->req[0]);
				$r = oci_execute($stmt);
				if (!$r) $this->raiseError();
				while($row = oci_fetch_array($stmt,OCI_ASSOC+OCI_RETURN_NULLS)) {
					//Relationship Code
					$key = array_search($row['EMR_CTC_RELATIONSHIP'],array_column($relationships,0));
					$row['EMR_CTC_RELATIONSHIP'] = array("id"=>$row['EMR_CTC_RELATIONSHIP'],"label"=>($key!==false)?$relationships[$key][1]:"");
					//Country Code
					$row['EMR_CTC_COUNTRY_CODE'] = 'USA';
					$key = array_search($row['EMR_CTC_COUNTRY_CODE'],array_column($countryCodes,'COUNTRY_CODE'));
					$row['EMR_CTC_COUNTRY_CODE'] = array("id"=>$row['EMR_CTC_COUNTRY_CODE'],"label"=>($key!==false)?$countryCodes[$key]['COUNTRY_SHORT_DESC']:"");

					$this->_arr[] = $row;
				}
				$this->_arr = $this->null2Empty($this->_arr);
				oci_free_statement($stmt);
		}

        $this->returnData = $this->_arr;
		if ($this->retJSON) $this->toJSON($this->returnData);
	}
}
