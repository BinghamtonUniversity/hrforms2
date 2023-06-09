<?php
/*
NB: set $this->reqAuth = false in __construct to allow calls to functions without authentication checks.  Call $this->checkAuth() from functions to selectively restrict access.

NB: HTTP Codes: https://tools.ietf.org/html/rfc7231#section-6
405: Method Not Allowed
501: Not Implemented

NB: HTTP Request Methods: https://tools.ietf.org/html/rfc7231#section-4.3
*/

class Template extends HRForms2 {
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
        if (($this->method == 'PATCH' || $this->method == 'PUT') && !isset($this->req[0])) $this->raiseError(E_BAD_REQUEST);
	}

	/* create functions GET,POST,PUT,PATCH,DELETE as needed - defaults provided from init reflection method */
	function GET() {
        if (!isset($this->req[0])) { // generate list
            $qry = "select template_id, template_name, template_slug, template_type, template_status_code from HRFORMS2_TEMPLATES order by template_name";
            $stmt = oci_parse($this->db,$qry);
            $r = oci_execute($stmt);
            if (!$r) $this->raiseError();
            oci_fetch_all($stmt,$this->_arr,null,null,OCI_FETCHSTATEMENT_BY_ROW);
        } else {
            $qry = "select * from HRFORMS2_TEMPLATES where ";
            $qry .= (is_numeric($this->req[0])) ? "TEMPLATE_ID = :req" : "TEMPLATE_SLUG = :req";
            $stmt = oci_parse($this->db,$qry);
            oci_bind_by_name($stmt,":req",$this->req[0]);
            $r = oci_execute($stmt);
            if (!$r) $this->raiseError();
            $row = oci_fetch_array($stmt,OCI_ASSOC+OCI_RETURN_NULLS);
            $this->_arr = $row;
            $this->_arr['TEMPLATE'] = (is_object($row['TEMPLATE'])) ? $row['TEMPLATE']->load() : "";
        }
        $this->_arr = $this->null2Empty($this->_arr);
        $this->returnData = $this->_arr;
        if ($this->retJSON) $this->toJSON($this->returnData);
	}

    function PATCH() {
        //update the template only
        $qry = "update HRFORMS2_TEMPLATES set template = EMPTY_CLOB() WHERE template_id = :template_id returning template into :template";
		$stmt = oci_parse($this->db,$qry);
		$clob = oci_new_descriptor($this->db, OCI_D_LOB);
		oci_bind_by_name($stmt, ":template_id", $this->req[0]);
		oci_bind_by_name($stmt, ":template", $clob, -1, OCI_B_CLOB);
		oci_execute($stmt,OCI_NO_AUTO_COMMIT);
		$clob->save($this->POSTvars['TEMPLATE']);
		oci_commit($this->db);
		$this->done();
    }
}
