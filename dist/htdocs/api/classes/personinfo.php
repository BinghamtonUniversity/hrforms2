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

	/** helper function to convert nulls to empty strings */
	function nullToEmpty(&$array) {
		foreach($array as &$row) {
			foreach($row as $key=>$value) {
				if (is_null($value)) $row[$key] = "";
			}
		}
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
			case "demographics":
				$qry = "select birth_date, us_citizen_indicator, non_citizen_type, emp_authorize_card_indicator, visa_code, citizenship_country_code, gender, hispanic_flag, ethnicity_mult_codes, ethnicity_source_dsc, disability_indicator, military_status_code, veteran_indicator, protected_vet_status_code, military_separation_date
					from buhr_person_mv@banner.cc.binghamton.edu
					where suny_id = :suny_id";
				$stmt = oci_parse($this->db,$qry);
				oci_bind_by_name($stmt,":suny_id", $this->req[0]);
				$r = oci_execute($stmt);
				if (!$r) $this->raiseError();
				oci_fetch_all($stmt,$this->_arr,null,null,OCI_FETCHSTATEMENT_BY_ROW);	
				$this->nullToEmpty($this->_arr);
				oci_free_statement($stmt);
	
				break;
			//split these?
			case "directory":
				// Get Address
				$qry = "select address_code, address_1, address_2, address_3, address_city, state_code, address_postal_code, create_date
					from buhr_address_mv@banner.cc.binghamton.edu
					where suny_id = :suny_id";
				$stmt = oci_parse($this->db,$qry);
				oci_bind_by_name($stmt,":suny_id", $this->req[0]);
				$r = oci_execute($stmt);
				if (!$r) $this->raiseError();
				oci_fetch_all($stmt,$this->_arr['address'],null,null,OCI_FETCHSTATEMENT_BY_ROW);	
				oci_free_statement($stmt);

				// Get Phone
				$qry = "select phone_type, phone_area_code || phone_exchange || phone_number as phone_number, create_date
					from buhr_phone_mv@banner.cc.binghamton.edu
					where suny_id = :suny_id";
				$stmt = oci_parse($this->db,$qry);
				oci_bind_by_name($stmt,":suny_id", $this->req[0]);
				$r = oci_execute($stmt);
				if (!$r) $this->raiseError();
				oci_fetch_all($stmt,$this->_arr['phone'],null,null,OCI_FETCHSTATEMENT_BY_ROW);	
				oci_free_statement($stmt);

				// Get Email
				$qry = "select email_type, email_address, create_date
				from buhr_email_mv@banner.cc.binghamton.edu
				where suny_id = :suny_id";
				$stmt = oci_parse($this->db,$qry);
				oci_bind_by_name($stmt,":suny_id", $this->req[0]);
				$r = oci_execute($stmt);
				if (!$r) $this->raiseError();
				oci_fetch_all($stmt,$this->_arr['email'],null,null,OCI_FETCHSTATEMENT_BY_ROW);	
				oci_free_statement($stmt);

				break;
			case "education":
				$qry = "select e.degree_year, e.degree_month, e.pending_degree_flag, e.degree_type,
				i.country_code, i.institution_state, i.institution_city, i.institution_id, i.institution, 
				e.highest_degree_flag, e.terminal_degree_flag, e.degree_verified, e.create_date
				from BUHR.BUHR_POST_SECONDARY_MV@banner.cc.binghamton.edu e
				left join (select to_char(i.unt_id) as institution_id, 'USA' as country_code, i.institution_state, i.institution_city, i.institution
					from sunyhr.degree_institutions@banner.cc.binghamton.edu i
					union
					select 'F' || f.fgn_dgr_instn_id, f.country_code, null, null, f.institution
					from sunyhr.foreign_degree_institutions@banner.cc.binghamton.edu f) i on (i.institution_id = nvl(e.unit_id,'F'||e.foreign_degree_instn_id))
				where suny_id = :suny_id";
				$stmt = oci_parse($this->db,$qry);
				oci_bind_by_name($stmt,":suny_id", $this->req[0]);
				$r = oci_execute($stmt);
				if (!$r) $this->raiseError();
				oci_fetch_all($stmt,$this->_arr,null,null,OCI_FETCHSTATEMENT_BY_ROW);	
				oci_free_statement($stmt);

				break;
			case "contact":
				$qry = "select emr_ctc_rank, emr_ctc_first_name, emr_ctc_last_name, emr_ctc_address_1, emr_ctc_address_2,
					emr_ctc_city, emr_ctc_state_code, emr_ctc_zip, emr_ctc_country_code, emr_ctc_day_phone,
					emr_ctc_night_phone, emr_ctc_cell_phone, emr_ctc_international_phone, emr_ctc_email,
					emr_ctc_relationship, create_date
				from  BUHR.BUHR_EMERGENCY_CONTACT_MV@banner.cc.binghamton.edu e
				where suny_id = :suny_id
				order by emr_ctc_rank";
				$stmt = oci_parse($this->db,$qry);
				oci_bind_by_name($stmt,":suny_id", $this->req[0]);
				$r = oci_execute($stmt);
				if (!$r) $this->raiseError();
				oci_fetch_all($stmt,$this->_arr,null,null,OCI_FETCHSTATEMENT_BY_ROW);
				foreach($this->_arr as &$row) {
					foreach($row as $key=>$value) {
						if (is_null($value)) $row[$key] = "";
					}
				}
				oci_free_statement($stmt);
		}

        $this->returnData = $this->_arr;
		if ($this->retJSON) $this->toJSON($this->returnData);
	}
}
