<?php
/*
NB: set $this->reqAuth = false in __construct to allow calls to functions without authentication checks.  Call $this->checkAuth() from functions to selectively restrict access.

NB: HTTP Codes: https://tools.ietf.org/html/rfc7231#section-6
405: Method Not Allowed
501: Not Implemented

NB: HTTP Request Methods: https://tools.ietf.org/html/rfc7231#section-4.3
*/

class Codes extends HRForms2 {
    private $_arr = array();
    private $codes = array("payroll","form","action","transaction");

    function __construct($req,$rjson=true) {
        $this->allowedMethods = "GET,POST,PUT,PATCH,DELETE"; //default: "" - NB: Add methods here: GET, POST, PUT, PATCH, DELETE
        $this->reqAuth = true; //default: true - NB: See note above
        $this->retJSON = $rjson;
        $this->req = $req;
        $this->init();
    }

    /**
     * validate called from init()
     */
    function validate() {
        if (in_array($this->method,array('PUT','PATCH','DELETE'))) {
            if (!$this->sessionData['isAdmin']) $this->raiseError(403);
            if (!isset($this->req[1])) $this->raiseError(400);
        }
        if ($this->method=="POST" && !$this->sessionData['isAdmin']) $this->raiseError(403);
        if (!in_array(strtolower($this->req[0]),$this->codes)) $this->raiseError(400);
    }

    /* create functions GET,POST,PUT,PATCH,DELETE as needed - defaults provided from init reflection method */
    function GET() {
        $qry = "SELECT * FROM HRFORMS2_".$this->req[0]."_CODES ";
        if (isset($this->req[1])) $qry .= "WHERE ".$this->req[0]."_CODE=:code ";
        $qry .= "ORDER BY ORDERBY,".$this->req[0]."_TITLE";
        $stmt = oci_parse($this->db,$qry);
        if (isset($this->req[1])) oci_bind_by_name($stmt,":code", $this->req[1]);
        $r = oci_execute($stmt);
        if (!$r) $this->raiseError();
        //oci_fetch_all($stmt,$this->_arr,null,null,OCI_FETCHSTATEMENT_BY_ROW);
        while ($row = oci_fetch_array($stmt,OCI_ASSOC+OCI_RETURN_NULLS+OCI_RETURN_LOBS)) {
            $row['ADDITIONAL_INFO'] = json_decode($row['ADDITIONAL_INFO'],true);
            $this->_arr[] = $row;
        }
        $this->returnData = $this->_arr;
        if ($this->retJSON) $this->toJSON($this->returnData);
    }
    function POST() {
        $qry = "INSERT INTO HRFORMS2_".$this->req[0]."_CODES VALUES(:code,:title,:active,:orderby,:description,EMPTY_CLOB()) returning ADDITIONAL_INFO into :addl_info";
        $stmt = oci_parse($this->db,$qry);
        $clob = oci_new_descriptor($this->db, OCI_D_LOB);
        $desc = substr($this->POSTvars['DESCRIPTION'],0,2000);
        oci_bind_by_name($stmt,":code", $this->POSTvars['CODE']);
        oci_bind_by_name($stmt,":title", $this->POSTvars['TITLE']);
        oci_bind_by_name($stmt,":description", $desc);
        oci_bind_by_name($stmt,":active", $this->POSTvars['ACTIVE']);
        oci_bind_by_name($stmt,":orderby", $this->POSTvars['ORDERBY']);
        oci_bind_by_name($stmt,":addl_info", $clob, -1, OCI_B_CLOB);
        $r = oci_execute($stmt,OCI_NO_AUTO_COMMIT);
        if (!$r) $this->raiseError();
        $clob->save(json_encode($this->POSTvars['ADDITIONAL_INFO']));
        oci_commit($this->db);
        oci_free_statement($stmt);
        if ($this->retJSON) $this->done();
    }
    function PUT() {
        if ($this->req[1] != $this->POSTvars['CODE']) {
            $qry = "SELECT count(*) FROM HRFORMS2_PAYROLL_TRANSACTIONS WHERE ".$this->req[0]."_code = :req1";
            $stmt = oci_parse($this->db,$qry);
            oci_bind_by_name($stmt,":req1", $this->req[1]);
            $r = oci_execute($stmt);
            if (!$r) $this->raiseError();
            $row = oci_fetch_array($stmt,OCI_RETURN_NULLS);
            if ($row[0] != 0) {
                $this->retJSON = false;
                $this->POST();
                $qry = "UPDATE HRFORMS2_PAYROLL_TRANSACTIONS SET ".$this->req[0]."_code = :code WHERE ".$this->req[0]."_code = :req1";
                $stmt = oci_parse($this->db,$qry);
                oci_bind_by_name($stmt,":code", $this->POSTvars['CODE']);
                oci_bind_by_name($stmt,":req1", $this->req[1]);
                $r = oci_execute($stmt);
                if (!$r) $this->raiseError();
                oci_commit($this->db);
                oci_free_statement($stmt);
                $this->DELETE();
                $this->done();
                exit();
            }
        }
        $qry = "UPDATE HRFORMS2_".$this->req[0]."_CODES SET ".$this->req[0]."_code = :code, ".$this->req[0]."_title = :title, ".
            $this->req[0]."_description = :description, active = :active, orderby = :orderby, 
                additional_info = EMPTY_CLOB() WHERE ".$this->req[0]."_code = :req1
                returning ADDITIONAL_INFO into :addl_info";
        $stmt = oci_parse($this->db,$qry);
        $clob = oci_new_descriptor($this->db, OCI_D_LOB);
        $desc = substr($this->POSTvars['DESCRIPTION'],0,2000);
        oci_bind_by_name($stmt,":code", $this->POSTvars['CODE']);
        oci_bind_by_name($stmt,":title", $this->POSTvars['TITLE']);
        oci_bind_by_name($stmt,":description", $desc);
        oci_bind_by_name($stmt,":active", $this->POSTvars['ACTIVE']);
        oci_bind_by_name($stmt,":orderby", $this->POSTvars['ORDERBY']);
        oci_bind_by_name($stmt,":addl_info", $clob, -1, OCI_B_CLOB);
        oci_bind_by_name($stmt,":req1", $this->req[1]);
        $r = oci_execute($stmt,OCI_NO_AUTO_COMMIT);
        if (!$r) $this->raiseError();
        $clob->save(json_encode($this->POSTvars['ADDITIONAL_INFO']));
        oci_commit($this->db);
        oci_free_statement($stmt);
        $this->done();
    }
    function PATCH() {
        //update active
        if (isset($this->POSTvars['ACTIVE'])) {
            // check to make sure the code is not in use
            $qry = "select count(*) from HRFORMS2_PAYROLL_TRANSACTIONS WHERE ".$this->req[0]."_code = :code";
            $stmt = oci_parse($this->db,$qry);
            oci_bind_by_name($stmt,":code", $this->req[1]);
            $r = oci_execute($stmt);
            if (!$r) $this->raiseError();
            $row = oci_fetch_array($stmt,OCI_NUM+OCI_RETURN_NULLS);
            if ($row[0] != "0") $this->raiseError(E_FORBIDDEN,array("errMsg"=>ucfirst($this->req[0])." Code in use"));

            $qry = "UPDATE HRFORMS2_".$this->req[0]."_CODES SET active = :active WHERE ".$this->req[0]."_code = :code";
            $stmt = oci_parse($this->db,$qry);
            oci_bind_by_name($stmt,":active", $this->POSTvars['ACTIVE']);
            oci_bind_by_name($stmt,":code", $this->req[1]);
            $r = oci_execute($stmt);
            if (!$r) $this->raiseError();
            oci_commit($this->db);
            oci_free_statement($stmt);
            //If there are active paytrans with code and code is being deactivated, deactivate paytrans
            if ($this->POSTvars['ACTIVE'] == 0) {
                $qry = "UPDATE HRFORMS2_PAYROLL_TRANSACTIONS set active = 0 WHERE ".$this->req[0]."_code = :code";
                $stmt = oci_parse($this->db,$qry);
                oci_bind_by_name($stmt,":code", $this->req[1]);
                $r = oci_execute($stmt);
                if (!$r) $this->raiseError();
                oci_commit($this->db);
                oci_free_statement($stmt);    
            }
        }
        //update orderby
        if (isset($this->POSTvars['ORDERBY'])) {
            $qry = "UPDATE HRFORMS2_".$this->req[0]."_CODES SET orderby = :orderby WHERE ".$this->req[0]."_code = :code";
            $stmt = oci_parse($this->db,$qry);
            oci_bind_by_name($stmt,":orderby", $this->POSTvars['ORDERBY']);
            oci_bind_by_name($stmt,":code", $this->req[1]);
            $r = oci_execute($stmt);
            if (!$r) $this->raiseError();
            oci_commit($this->db);
            oci_free_statement($stmt);
        }
        $this->done();
    }
    function DELETE() {
        // check to make sure the code is not in use; do not need to check for forms because cannot delete/deactivate the transaction if there are forms.
        $qry = "select count(*) from HRFORMS2_PAYROLL_TRANSACTIONS WHERE ".$this->req[0]."_code = :code";
        $stmt = oci_parse($this->db,$qry);
        oci_bind_by_name($stmt,":code", $this->req[1]);
        $r = oci_execute($stmt);
        if (!$r) $this->raiseError();
        $row = oci_fetch_array($stmt,OCI_NUM+OCI_RETURN_NULLS);
        if ($row[0] != "0") $this->raiseError(E_FORBIDDEN,array("errMsg"=>ucfirst($this->req[0])." Code in use"));

        $qry = "DELETE FROM HRFORMS2_".$this->req[0]."_CODES where ".$this->req[0]."_code = :code";
        $stmt = oci_parse($this->db,$qry);
        oci_bind_by_name($stmt,":code", $this->req[1]);
        $r = oci_execute($stmt);
        if (!$r) $this->raiseError();
        oci_commit($this->db);
        oci_free_statement($stmt);
        if ($this->retJSON) $this->done();
    }
}
