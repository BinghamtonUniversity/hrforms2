<?php
/*
NB: set $this->reqAuth = false in __construct to allow calls to functions without authentication checks.  Call $this->checkAuth() from functions to selectively restrict access.

NB: HTTP Codes: https://tools.ietf.org/html/rfc7231#section-6
405: Method Not Allowed
501: Not Implemented

NB: HTTP Request Methods: https://tools.ietf.org/html/rfc7231#section-4.3
*/

class Position extends HRForms2 {
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
		if (sizeof($this->req)<2) $this->raiseError(400);
	}

	/* create functions GET,POST,PUT,PATCH,DELETE as needed - defaults provided from init reflection method */
	function GET() {
        $qry = "select hr_pos_id as position_id, lin_itm_nbr as line_number, pr_agy_cd as payroll, 
				pos_eff_dt as effective_date, seg_cd as segment_code, ttl_shr_dsc as title, nu_cd as negotiating_unit, 
				sal_grd_pre || sal_grd_suf as salary_grade, pos_pct as position_percent, pay_bas_cd as pay_basis, 
				dpt_cd as position_department_code, dpt_cmp_dsc as position_department, data_sts as position_status
			from BUHR_POSITION_MV@banner.cc.binghamton.edu
			where pr_agy_cd = :payroll
			and lin_itm_nbr = :line_number
			and pos_eff_dt <= :eff_date
			and data_sts <> 'H'
			order by pos_eff_dt desc, data_sts, decode(data_sts,'C',1,'F',2,3) asc";
        $stmt = oci_parse($this->db,$qry);
        $eff_date = (!isset($this->req[2]))?date('d-M-Y'):$this->req[2];
        oci_bind_by_name($stmt,":payroll", $this->req[0]);
        oci_bind_by_name($stmt,":line_number", $this->req[1]);
        oci_bind_by_name($stmt,":eff_date", $eff_date);
		$r = oci_execute($stmt);
		if (!$r) $this->raiseError();
		$row = oci_fetch_array($stmt,OCI_ASSOC+OCI_RETURN_NULLS);
		oci_free_statement($stmt);
		$this->returnData = $row;
		if ($this->retJSON) $this->toJSON($this->returnData);
	}
}
