<?php
/*
NB: set $this->reqAuth = false in __construct to allow calls to functions without authentication checks.  Call $this->checkAuth() from functions to selectively restrict access.

NB: HTTP Codes: https://tools.ietf.org/html/rfc7231#section-6
405: Method Not Allowed
501: Not Implemented

NB: HTTP Request Methods: https://tools.ietf.org/html/rfc7231#section-4.3
*/

class Education extends HRForms2 {
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
        if (!isset($this->req[0])) $this->raiseError(400);
    }

    /* create functions GET,POST,PUT,PATCH,DELETE as needed - defaults provided from init reflection method */
    function GET() {
        // Country Code to "State" translation.
        if ($this->req[0] == 'ASM') $this->req = array('USA','AS');
        if ($this->req[0] == 'FSM') $this->req = array('USA','FM');
        if ($this->req[0] == 'GUM') $this->req = array('USA','GU');
        if ($this->req[0] == 'MHL') $this->req = array('USA','MH');
        if ($this->req[0] == 'MNP') $this->req = array('USA','MP');
        if ($this->req[0] == 'PLW') $this->req = array('USA','PW');
        if ($this->req[0] == 'PRI') $this->req = array('USA','PR');
        if ($this->req[0] == 'VIR') $this->req = array('USA','VI');
        switch(sizeof($this->req)) {
            case 1:
                if ($this->req[0] == 'USA') $this->raiseError(400);
                $qry = "select
                'F'||fgn_dgr_instn_id as id, institution, null as institution_address, 
                null as institution_city, null as institution_state, null as institution_zip, country_code as institution_country_code
                from SUNYHR.FOREIGN_DEGREE_INSTITUTIONS@banner.cc.binghamton.edu
                where data_status = 'C' and country_code = :country_code
                order by institution";
                $stmt = oci_parse($this->db,$qry);
                oci_bind_by_name($stmt,":country_code",$this->req[0]);
                break;
            case 2:
                if ($this->req[0] != 'USA') $this->raiseError(400);
                $qry = "select unt_id as id, institution, institution_address, institution_city, institution_state, institution_zip, 'USA' as institution_country_code
                from SUNYHR.DEGREE_INSTITUTIONS@banner.cc.binghamton.edu
                where data_status = 'C' and institution_state = :state
                order by institution";
                $stmt = oci_parse($this->db,$qry);
                oci_bind_by_name($stmt,":state",$this->req[1]);
                break;
            default:
                $this->raiseError(400);
        }
        oci_execute($stmt);
        oci_fetch_all($stmt,$this->_arr,null,null,OCI_FETCHSTATEMENT_BY_ROW);
        $this->returnData = $this->_arr;
        if ($this->retJSON) $this->toJSON($this->returnData);
    }
}
