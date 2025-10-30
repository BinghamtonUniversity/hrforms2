<?php
/*
NB: set $this->reqAuth = false in __construct to allow calls to functions without authentication checks.  Call $this->checkAuth() from functions to selectively restrict access.

NB: HTTP Codes: https://tools.ietf.org/html/rfc7231#section-6
405: Method Not Allowed
501: Not Implemented

NB: HTTP Request Methods: https://tools.ietf.org/html/rfc7231#section-4.3
*/

class Check extends HRForms2 {
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
        if (!in_array(strtolower($this->req[0]),array('form'))) $this->raiseError(400);
    }

    /* create functions GET,POST,PUT,PATCH,DELETE as needed - defaults provided from init reflection method */
    function POST() {
        if ($this->req[0] == 'form') {
            $qry = "select count(*)
                from hrforms2_forms f
                where f.form_data.payroll.PAYROLL_CODE = :payroll_code
                and f.form_data.formActions.formCode.FORM_CODE = :form_code
                and nvl(f.form_data.formActions.actionCode.ACTION_CODE,'x') = nvl(:action_code,'x')
                and nvl(f.form_data.formActions.transactionCode.TRANSACTION_CODE,'x') = nvl(:transaction_code,'x')
                and (
                    nvl(f.form_data.person.information.SUNY_ID,'x') = nvl(:suny_id,'x') or
                    nvl(f.form_data.person.information.LOCAL_CAMPUS_ID,'x') = nvl(:bnumber,'x')
                )";
            $stmt = oci_parse($this->db,$qry);
            oci_bind_by_name($stmt,":payroll_code", $this->POSTvars['payroll']);
            oci_bind_by_name($stmt,":form_code", $this->POSTvars['form_code']);
            oci_bind_by_name($stmt,":action_code", $this->POSTvars['action_code']);
            oci_bind_by_name($stmt,":transaction_code", $this->POSTvars['transaction_code']);
            oci_bind_by_name($stmt,":suny_id", $this->POSTvars['suny_id']);
            oci_bind_by_name($stmt,":bnumber", $this->POSTvars['bnumber']);
            $r = oci_execute($stmt);
            if (!$r) $this->raiseError();
            $row = oci_fetch_array($stmt,OCI_NUM);
            $this->returnData = array('count'=>$row[0]);
            if ($this->retJSON) $this->toJSON($this->returnData);
            return;
        }
        $this->raiseError(400); // Should not get here
    }
}
