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
    }

    /* create functions GET,POST,PUT,PATCH,DELETE as needed - defaults provided from init reflection method */
    function GET() {
        $label = "trim(legal_last_name || decode(suffix_code,null,'',' ' || suffix_code) || ', ' || nvl(alias_first_name,legal_first_name) || ' ' || substr(legal_middle_name,0,1))";
        if (array_key_exists('bnumber',$_GET)) {
            $label = "trim(legal_last_name || decode(suffix_code,null,'',' ' || suffix_code) || ', ' || nvl(alias_first_name,legal_first_name) || ' ' || substr(legal_middle_name,0,1)) || ' (' || local_campus_id || ')' ";
        }
        $qry = "select distinct suny_id as id, 
            " . $label . " as label
        from buhr.buhr_person_mv@banner.cc.binghamton.edu
        where lower(" . $label . ") like '%' || lower(:filter) || '%'
        and data_status = 'C'
        order by " . $label;
        $stmt = oci_parse($this->db,$qry);
        oci_bind_by_name($stmt,":filter", $this->req[0]);
        $r = oci_execute($stmt);
        if (!$r) $this->raiseError();
        oci_fetch_all($stmt,$this->_arr,null,null,OCI_FETCHSTATEMENT_BY_ROW);
        $this->returnData = array_map(function($a) {
            return array_change_key_case($a);
        },$this->_arr);
        if ($this->retJSON) $this->toJSON($this->returnData);
    }
}
