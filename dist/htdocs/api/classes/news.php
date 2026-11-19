<?php
/*
NB: set $this->reqAuth = false in __construct to allow calls to functions without authentication checks.  Call $this->checkAuth() from functions to selectively restrict access.

NB: HTTP Codes: https://tools.ietf.org/html/rfc7231#section-6
405: Method Not Allowed
501: Not Implemented

NB: HTTP Request Methods: https://tools.ietf.org/html/rfc7231#section-4.3
*/

class News extends HRForms2 {
    private $_arr = array();

    function __construct($req,$rjson=true) {
        $this->allowedMethods = "GET,PATCH"; //default: "" - NB: Add methods here: GET, POST, PUT, PATCH, DELETE
        $this->reqAuth = true; //default: true - NB: See note above
        $this->retJSON = $rjson;
        $this->req = $req;
        $this->init();
    }

    /**
     * validate called from init()
     */
    function validate() {
        if ($this->method != 'GET' && !$this->sessionData['isAdmin']) $this->raiseError(E_FORBIDDEN,array("errMsg"=>"You do not have permission to access this resource."));
    }

    /* create functions GET,POST,PUT,PATCH,DELETE as needed - defaults provided from init reflection method */
    function GET() {
        $qry = "select NEWS_TEXT, to_char(modified_date,'DD-MON-YY HH24:MI:SS') as MODIFIED_DATE, MODIFIED_BY from hrforms2_news";
        $stmt = oci_parse($this->db,$qry);
        $r = oci_execute($stmt);
        if (!$r) $this->raiseError();
        $row = oci_fetch_array($stmt,OCI_ASSOC+OCI_RETURN_NULLS+OCI_RETURN_LOBS);
        if (!$row) $row = ["NEWS_TEXT"=>"","MODIFIED_DATE"=>"0","MODIFIED_BY"=>""];
        oci_free_statement($stmt);
        $this->returnData = $this->null2Empty($row);
        if ($this->retJSON) $this->toJSON($this->returnData);
    }
    function PATCH() {
        $qry = "select count(*) as CNT from hrforms2_news";
        $stmt = oci_parse($this->db,$qry);
        $r = oci_execute($stmt);
        if (!$r) $this->raiseError();
        $row = oci_fetch_array($stmt,OCI_ASSOC+OCI_RETURN_NULLS);
        oci_free_statement($stmt);
        if ($row['CNT'] == 0) {
            $qry = "insert into hrforms2_news (news_text, modified_date, modified_by) values (".((INSTANCE=="LOCAL")?"' '":"EMPTY_CLOB()").", sysdate, :suny_id) returning news_text into :news";
            $stmt = oci_parse($this->db,$qry);
            $clob = oci_new_descriptor($this->db, OCI_D_LOB);
            oci_bind_by_name($stmt, ":suny_id", $this->sessionData['SUNY_ID']);
            oci_bind_by_name($stmt, ":news", $clob, -1, OCI_B_CLOB);
            $r = oci_execute($stmt,OCI_NO_AUTO_COMMIT);
            if (!$r) $this->raiseError();
            $clob->save($this->POSTvars['NEWS_TEXT']);
            oci_commit($this->db);
            oci_free_statement($stmt);
        } else {
            $qry = "update hrforms2_news set news_text = ".((INSTANCE=="LOCAL")?"' '":"EMPTY_CLOB()").", modified_date = sysdate, modified_by = :suny_id returning news_text into :news";
            $stmt = oci_parse($this->db,$qry);
            $clob = oci_new_descriptor($this->db, OCI_D_LOB);
            oci_bind_by_name($stmt, ":suny_id", $this->sessionData['SUNY_ID']);
            oci_bind_by_name($stmt, ":news", $clob, -1, OCI_B_CLOB);
            $r = oci_execute($stmt,OCI_NO_AUTO_COMMIT);
            if (!$r) $this->raiseError();
            $clob->save($this->POSTvars['NEWS_TEXT']);
            oci_commit($this->db);
            oci_free_statement($stmt);
        }
        $this->GET();
        exit();
    }
}
