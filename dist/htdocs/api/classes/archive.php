<?php
/*
NB: set $this->reqAuth = false in __construct to allow calls to functions without authentication checks.  Call $this->checkAuth() from functions to selectively restrict access.

NB: HTTP Codes: https://tools.ietf.org/html/rfc7231#section-6
405: Method Not Allowed
501: Not Implemented

NB: HTTP Request Methods: https://tools.ietf.org/html/rfc7231#section-4.3
*/

class Archive extends HRForms2 {
    private $_arr = array();

    function __construct($req,$rjson=true) {
        $this->allowedMethods = "POST"; //default: "" - NB: Add methods here: GET, POST, PUT, PATCH, DELETE
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
    function POST() {
        switch($this->req[0]) {
            case "request":
                // select from HRFORMS2_REQUESTS and get the JSON data
                // add the workflow with group detail to the JSON
                // insert into the archive table.

                $qry = "insert into HRFORMS2_REQUESTS_ARCHIVE 
                    select request_id, created_by, created_date, trunc(to_timestamp(r.request_data.effDate,'YYYY-MM-DD\"T\"HH24:MI:SS.FF3\"Z\"')), request_data 
                    from HRFORMS2_REQUESTS r where request_id = :request_id";
                $stmt = oci_parse($this->db,$qry);
                oci_bind_by_name($stmt,":request_id",$this->req[1]);
                $r = oci_execute($stmt);
                if (!$r) $this->raiseError();
                $qry = "insert into HRFORMS2_REQUESTS_JOURNAL_ARCHIVE select * from HRFORMS2_REQUESTS_JOURNAL where request_id = :request_id";
                $stmt = oci_parse($this->db,$qry);
                oci_bind_by_name($stmt,":request_id",$this->req[1]);
                $r = oci_execute($stmt);
                if (!$r) $this->raiseError();
                $qry = "delete from HRFORMS2_REQUESTS where request_id = :request_id";
                $stmt = oci_parse($this->db,$qry);
                oci_bind_by_name($stmt,":request_id",$this->req[1]);
                $r = oci_execute($stmt);
                if (!$r) $this->raiseError();
                if ($this->retJSON) $this->done();
                break;
            case "form":
                $qry = "insert into HRFORMS2_FORMS_ARCHIVE 
                    select form_id, created_by, created_date, trunc(to_timestamp(f.form_data.effDate,'YYYY-MM-DD\"T\"HH24:MI:SS.FF3\"Z\"')), form_data 
                    from HRFORMS2_FORMS f where form_id = :form_id";
                $stmt = oci_parse($this->db,$qry);
                oci_bind_by_name($stmt,":form_id",$this->req[1]);
                $r = oci_execute($stmt);
                if (!$r) $this->raiseError();
                $qry = "insert into HRFORMS2_FORMS_JOURNAL_ARCHIVE select * from HRFORMS2_FORMS_JOURNAL where form_id = :form_id";
                $stmt = oci_parse($this->db,$qry);
                oci_bind_by_name($stmt,":form_id",$this->req[1]);
                $r = oci_execute($stmt);
                if (!$r) $this->raiseError();
                $qry = "delete from HRFORMS2_FORMS where form_id = :form_id";
                $stmt = oci_parse($this->db,$qry);
                oci_bind_by_name($stmt,":form_id",$this->req[1]);
                $r = oci_execute($stmt);
                if (!$r) $this->raiseError();
                if ($this->retJSON) $this->done();
                break;
            default:
                $this->raiseError(E_BADREQUEST,array("msg"=>"Invalid archive type"));
        }
    }
    function DELETE() {
        switch($this->req[0]) {
            case "request":
                $qry = "insert into HRFORMS2_REQUESTS select * from HRFORMS2_REQUESTS_ARCHIVE where request_id = :request_id";
                $stmt = oci_parse($this->db,$qry);
                oci_bind_by_name($stmt,":request_id",$this->req[1]);
                $r = oci_execute($stmt);
                if (!$r) $this->raiseError();
                $qry = "insert into HRFORMS2_REQUESTS_JOURNAL select * from HRFORMS2_REQUESTS_JOURNAL_ARCHIVE where request_id = :request_id";
                $stmt = oci_parse($this->db,$qry);
                oci_bind_by_name($stmt,":request_id",$this->req[1]);
                $r = oci_execute($stmt);
                if (!$r) $this->raiseError();
                $qry = "delete from HRFORMS2_REQUESTS_ARCHIVE where request_id = :request_id";
                $stmt = oci_parse($this->db,$qry);
                oci_bind_by_name($stmt,":request_id",$this->req[1]);
                $r = oci_execute($stmt);
                if (!$r) $this->raiseError();
                $this->done();
                break;
            case "form":
                echo "unarchive forms";
                break;
            default:
                $this->raiseError(E_BADREQUEST,array("msg"=>"Invalid archive type"));
        }
    }
}
