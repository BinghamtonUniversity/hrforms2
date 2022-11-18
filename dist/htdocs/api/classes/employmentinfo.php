<?php
/*
NB: set $this->reqAuth = false in __construct to allow calls to functions without authentication checks.  Call $this->checkAuth() from functions to selectively restrict access.

NB: HTTP Codes: https://tools.ietf.org/html/rfc7231#section-6
405: Method Not Allowed
501: Not Implemented

NB: HTTP Request Methods: https://tools.ietf.org/html/rfc7231#section-4.3
*/

class EmploymentInfo extends HRForms2 {
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
			case "appointment":
				$qry = "select p.hr_person_id, p.suny_id, 
					p.term_duration, p.notice_date, p.continuing_permanency_date, p.tenure_status,
					p.campus_title, s.*,
					p.reporting_department_code, p.derived_fac_type
				from buhr.buhr_persemp_mv@banner.cc.binghamton.edu p
				left join (select suny_id as supervisor_suny_id, 
					legal_last_name || decode(suffix_code,null,'',' ' || suffix_code) || ', ' || nvl(alias_first_name,legal_first_name) || ' ' || substr(legal_middle_name,0,1) as supervisor_name
					from buhr.buhr_person_mv@banner.cc.binghamton.edu) s on (p.supervisor_suny_id = s.supervisor_suny_id)
				where p.hr_person_id = :hr_person_id";
				$stmt = oci_parse($this->db,$qry);
				oci_bind_by_name($stmt,":hr_person_id", $this->req[0]);
				$r = oci_execute($stmt);
				if (!$r) $this->raiseError();
				oci_fetch_all($stmt,$data,null,null,OCI_FETCHSTATEMENT_BY_ROW);
				$this->nullToEmpty($data);
				$this->_arr = $data[0];
				oci_free_statement($stmt);

				break;
			case "position":
				$qry = "select p.hr_person_id, p.suny_id,
					p.line_item_number, p.appointment_type, p.appointment_percent, p.obl_cd, p.benefit_flag,
					p.appointment_effective_date, p.appointment_end_date, e.voluntary_reduction, p.payroll_mail_drop_id
				from  BUHR.BUHR_PERSEMP_MV@banner.cc.binghamton.edu p
				left join (select hr_employment_status_id, voluntary_reduction from BUHR.BUHR_EMPL_STATUS_MV@banner.cc.binghamton.edu) e on (e.hr_employment_status_id = p.hr_employment_status_id)
				where hr_person_id = :hr_person_id";
				$stmt = oci_parse($this->db,$qry);
				oci_bind_by_name($stmt,":hr_person_id", $this->req[0]);
				$r = oci_execute($stmt);
				if (!$r) $this->raiseError();
				oci_fetch_all($stmt,$data,null,null,OCI_FETCHSTATEMENT_BY_ROW);
				$this->nullToEmpty($data);
				$this->_arr = $data[0];
				oci_free_statement($stmt);

				break;
		}
        $this->returnData = $this->_arr;
		if ($this->retJSON) $this->toJSON($this->returnData);
	}
}
