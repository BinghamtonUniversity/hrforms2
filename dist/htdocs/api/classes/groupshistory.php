<?php
/*
NB: set $this->reqAuth = false in __construct to allow calls to functions without authentication checks.  Call $this->checkAuth() from functions to selectively restrict access.

NB: HTTP Codes: https://tools.ietf.org/html/rfc7231#section-6
405: Method Not Allowed
501: Not Implemented

NB: HTTP Request Methods: https://tools.ietf.org/html/rfc7231#section-4.3
*/

class GroupsHistory extends HRForms2 {
    private $_arr = array();

    function __construct($req,$rjson=true) {
        $this->allowedMethods = "GET"; //default: "" - NB: Add methods here: GET, POST, PUT, PATCH, DELETE
        $this->reqAuth = true; //default: true - NB: See note above
        $this->retJSON = $rjson;
        $this->req = $req;
        $this->init();
    }

    private function setType () {
        //TODO: fix pluralism - make consistent across application
        switch($this->req[0]) {
            case "request":
            case "requests":
                $this->k = array("id"=>"request_id","master"=>"hrforms2_requests","journal"=>"hrforms2_requests_journal","archive"=>false);
                break;
            case "form":
            case "forms":
                $this->k = array("id"=>"form_id","master"=>"hrforms2_forms","journal"=>"hrforms2_forms_journal","archive"=>false);
                break;
        }
    }

    private function validateID() {
        $qry = "select 1 from ".$this->k['master']." where ".$this->k['id']." = :id";
        $stmt = oci_parse($this->db,$qry);
        oci_bind_by_name($stmt,":id",$this->req[1]);
        $r = oci_execute($stmt);
        if (!$r) $this->raiseError();
        $row = oci_fetch_array($stmt,OCI_NUM);
        oci_free_statement($stmt);
        if (!$row) {
            // check archive
            $qry = "select 2 from ".$this->k['master']."_archive where ".$this->k['id']." = :id";
            $stmt = oci_parse($this->db,$qry);
            oci_bind_by_name($stmt,":id",$this->req[1]);
            $r = oci_execute($stmt);
            if (!$r) $this->raiseError();
            $row = oci_fetch_array($stmt,OCI_NUM);
            if (!$row) return false;
            $this->k['master'] .= "_archive";
            $this->k['journal'] .= "_archive";
            $this->k['archive'] = true;
        }
        return true;
    }

    private function validateUser() {
        // If isAdmin and not impersonating short-circuit return true;
        //TODO: also need to allow /requests/{id} and /forms/{id}
        if ($this->sessionData['isAdmin'] && $this->sessionData['OVR_SUNY_ID'] == "") return true;

        $qry = "select 1
            from ".$this->k['journal']."
            where ".$this->k['id']." = :id
            and suny_id = :suny_id
            union 
            select 1
            from ".$this->k['journal']." j, hrforms2_user_groups ug
            where j.".$this->k['id']." = :id
            and j.group_to != '-99'
            and ug.group_id = j.group_to
            and ug.suny_id = :suny_id";
        $stmt = oci_parse($this->db,$qry);
        oci_bind_by_name($stmt,":id",$this->req[1]);
        oci_bind_by_name($stmt,":suny_id",$this->sessionData['EFFECTIVE_SUNY_ID']);
        $r = oci_execute($stmt);
        if (!$r) $this->raiseError();
        $row = oci_fetch_array($stmt,OCI_NUM);
        if (!$row) return false;
        return true;
    }

    /**
     * validate called from init()
     */
    function validate() {
        $this->setType();
        if ($this->k['id'] == "") $this->raiseError(E_BAD_REQUEST);
        if ($this->method == 'GET') {
            // GET should receive two parameters; type and id
            if (sizeof($this->req) != 2) $this->raiseError(E_BAD_REQUEST);
            // Verify the ID is valid/exists
            if (!$this->validateID()) $this->raiseError(E_NOT_FOUND);
            // Verify effective user is permitted to access information
            if (!$this->validateUser()) $this->raiseError(E_NOT_FOUND);
        }
    }

    /* create functions GET,POST,PUT,PATCH,DELETE as needed - defaults provided from init reflection method */
    function GET() {
        $qry = "select sequence,rank, group_id, group_name, group_description, history_date, journal_date
        from " . $this->k['journal'] ." j,
        (
            select dense_rank() over (partition by group_id order by history_date asc) rank, g2.*
            from (
                select g.*, null as method, sysdate as history_date from hrforms2_groups g
                union 
                select * from hrforms2_groups_history
            ) g2
        ) grp 
        where ". $this->k['id'] ." = :id
        and grp.group_id = j.group_to
        and grp.history_date >= j.journal_date
        order by journal_date, sequence, rank";
        $stmt = oci_parse($this->db,$qry);
        oci_bind_by_name($stmt,":id",$this->req[1]);
        $r = oci_execute($stmt);
        if (!$r) $this->raiseError();
        while ($row = oci_fetch_array($stmt,OCI_ASSOC+OCI_RETURN_NULLS)) {
            $this->_arr[] = $row;
        }
        oci_free_statement($stmt);
        $this->returnData = $this->null2Empty($this->_arr);
        if ($this->retJSON) $this->toJSON($this->returnData);
    }
}
