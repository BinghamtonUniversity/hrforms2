<?php
/*
NB: set $this->reqAuth = false in __construct to allow calls to functions without authentication checks.  Call $this->checkAuth() from functions to selectively restrict access.

NB: HTTP Codes: https://tools.ietf.org/html/rfc7231#section-6
405: Method Not Allowed
501: Not Implemented

NB: HTTP Request Methods: https://tools.ietf.org/html/rfc7231#section-4.3
*/

class LoginHistory extends HRForms2 {
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
        $qry = "select user_id, bnumber, suny_id, ip_address, login_date, user_agent 
            from hrforms2_sessions
            where suny_id = :suny_id
            order by login_date desc";
        $stmt = oci_parse($this->db,$qry);
        oci_bind_by_name($stmt, ":suny_id", $this->sessionData['SUNY_ID']);
        $r = oci_execute($stmt);
        if (!$r) $this->raiseError();
        $rows = array();
        while ($row = oci_fetch_assoc($stmt)) {
            $rows[] = $row;
        }
        oci_free_statement($stmt);
        $this->toJSON($rows);
    }
}
