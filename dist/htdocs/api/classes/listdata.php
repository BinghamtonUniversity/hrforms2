<?php
/*
NB: set $this->reqAuth = false in __construct to allow calls to functions without authentication checks.  Call $this->checkAuth() from functions to selectively restrict access.

NB: HTTP Codes: https://tools.ietf.org/html/rfc7231#section-6
405: Method Not Allowed
501: Not Implemented

NB: HTTP Request Methods: https://tools.ietf.org/html/rfc7231#section-4.3
*/

class ListData extends HRForms2 {
    private $_arr = array();

    function __construct($req,$rjson=true) {
        $this->allowedMethods = "GET"; //default: "" - NB: Add methods here: GET, POST, PUT, PATCH, DELETE
        $this->reqAuth = false; //default: true - NB: See note above
        $this->retJSON = $rjson;
        $this->req = $req;
        $this->init();
    }

    /**
     * validate called from init()
     */
    function validate() {
        if (!isset($this->req[0])) $this->raiseError(E_BAD_REQUEST,array("errMsg"=>"List identifier (ID or SLUG) is required."));
    }

    /* create functions GET,POST,PUT,PATCH,DELETE as needed - defaults provided from init reflection method */
    function GET() {
        $qry = "select LIST_TYPE,LIST_DATA from HRFORMS2_LISTS where ";
        $qry .= (is_numeric($this->req[0])) ? "LIST_ID = :req" : "LIST_SLUG = :req";
        $stmt = oci_parse($this->db,$qry);
        oci_bind_by_name($stmt,":req",$this->req[0]);
        $r = oci_execute($stmt);
        if (!$r) $this->raiseError();
        $row = oci_fetch_array($stmt,OCI_ASSOC+OCI_RETURN_NULLS+OCI_RETURN_LOBS);
        $this->_arr['LIST_TYPE'] = $row['LIST_TYPE'];
        $this->_arr['LIST_DATA'] = $row['LIST_DATA'];
        oci_free_statement($stmt);
        if ($this->_arr['LIST_TYPE'] == 'sql') {
            $qry = $this->_arr['LIST_DATA'];
            $stmt = oci_parse($this->db,$qry);
            $r = oci_execute($stmt);
            if (!$r) $this->raiseError();
            oci_fetch_all($stmt,$this->_arr,null,null,OCI_FETCHSTATEMENT_BY_ROW);
            $this->returnData = $this->_arr;
        } else {
            $this->returnData = json_decode($this->_arr['LIST_DATA']);
        }
        if ($this->retJSON) $this->toJSON($this->returnData);
    }
}
