<?php
/*
NB: set $this->reqAuth = false in __construct to allow calls to functions without authentication checks.  Call $this->checkAuth() from functions to selectively restrict access.

NB: HTTP Codes: https://tools.ietf.org/html/rfc7231#section-6
405: Method Not Allowed
501: Not Implemented

NB: HTTP Request Methods: https://tools.ietf.org/html/rfc7231#section-4.3
*/

class Person extends HRForms2 {
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
		// Validation...
        //when GET and req[0] == bnumber there should be req[1] and match format of B#
        //when GET and req[0] == last_dob there should be req[1] and req[2] and req[2] format of yyyy-mon-dd?
        if ($this->method == "GET") {
            switch($this->req[0]) {
                case "bnumber":
                    if (sizeof($this->req)!=2) $this->raiseError(400);
                    break;
                case "lastnamedob":
                    if (sizeof($this->req)!=3) $this->raiseError(400);
                    $d = date_parse_from_format('d-M-Y',$this->req[2]);
                    if (!$d || $d['error_count']!=0) $this->raiseError(400);
                    break;
                default:
                    $this->raiseError(400);
            }
        }
	}

	/* create functions GET,POST,PUT,PATCH,DELETE as needed - defaults provided from init reflection method */
	function GET() {
        $qry = "SELECT pers.hr_person_id, pemp.line_item_number, pers.suny_id, pers.nys_emplid, 
            nvl(pemp.employment_role_type, pers.role_type) as employment_role_type,
            nvl(pemp.data_status_emp, pers.role_status) as data_status_emp, pemp.status_type,
            nvl(pemp.appointment_effective_date, pers.role_effective_date) as appointment_effective_date,
            nvl(pemp.appointment_end_date, pers.role_end_date) as appointment_end_date,
            pers.birth_date, pers.salutation_code, pers.legal_first_name, pers.legal_middle_name, pers.legal_last_name, pers.suffix_code,
            pers.local_campus_id, pemp.payroll_agency_code, pemp.title_description, pemp.dpt_cmp_dsc,
            pers.gender, pers.citizenship_country_code, pers.veteran_indicator, pers.military_status_code
            FROM buhr.buhr_person_mv@banner.cc.binghamton.edu pers
            JOIN (SELECT hr_person_id, line_item_number,employment_role_type, data_status_emp, status_type, appointment_effective_date,
                appointment_end_date, payroll_agency_code, title_description, dpt_cmp_dsc
                FROM buhr.buhr_person_empl_mv@banner.cc.binghamton.edu) pemp on (pers.hr_person_id = pemp.hr_person_id)
            WHERE pers.role_type <> 'STSCH' ";
		switch($this->req[0]) {
            case "bnumber":
                $qry .= "AND upper(pers.local_campus_id) = :bnumber";
                $stmt = oci_parse($this->db,$qry);
                oci_bind_by_name($stmt,":bnumber", $this->req[1]);
                break;
            case "lastnamedob":
                $qry .= "AND upper(pers.legal_last_name) = upper(:lastname) AND pers.birth_date = :dob";
                $stmt = oci_parse($this->db,$qry);
                oci_bind_by_name($stmt,":lastname", $this->req[1]);
                oci_bind_by_name($stmt,":dob", $this->req[2]);
                break;
            default:
                //should not get here, just in case.
                $this->raiseError(400);
        }
        $r = oci_execute($stmt);
		if (!$r) $this->raiseError();
        oci_fetch_all($stmt,$this->_arr,null,null,OCI_FETCHSTATEMENT_BY_ROW);
        $this->returnData = $this->_arr;
        if ($this->retJSON) $this->toJSON($this->returnData);
	}
}
