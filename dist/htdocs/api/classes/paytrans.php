<?php
/*
NB: set $this->reqAuth = false in __construct to allow calls to functions without authentication checks.  Call $this->checkAuth() from functions to selectively restrict access.

NB: HTTP Codes: https://tools.ietf.org/html/rfc7231#section-6
405: Method Not Allowed
501: Not Implemented

NB: HTTP Request Methods: https://tools.ietf.org/html/rfc7231#section-4.3
*/

class PayTrans extends HRForms2 {
    private $_arr = array();

    function __construct($req,$rjson=true) {
        $this->allowedMethods = "GET, POST, PUT, PATCH, DELETE"; //default: "" - NB: Add methods here: GET, POST, PUT, PATCH, DELETE
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
            if (!isset($this->req[0])) $this->raiseError(400);
        }
        if ($this->method=="POST" && !$this->sessionData['isAdmin']) $this->raiseError(403);
    }

    /* create functions GET,POST,PUT,PATCH,DELETE as needed - defaults provided from init reflection method */
    function GET() {
        $qry = "SELECT pt.paytrans_id, pt.payroll_code, p.payroll_title, p.payroll_description,
            pt.form_code, f.form_title, f.form_description,
            pt.action_code, a.action_title, a.action_description,
            pt.transaction_code, t.transaction_title, t.transaction_description,
            pt.active,pt.route_by, pt.pr_required, pt.available_for, pt.tabs
            FROM HRFORMS2_PAYROLL_TRANSACTIONS pt
            join (select PAYROLL_CODE, PAYROLL_TITLE, PAYROLL_DESCRIPTION from HRFORMS2_PAYROLL_CODES) p on (pt.PAYROLL_CODE = p.PAYROLL_CODE)
            join (select FORM_CODE, FORM_TITLE, FORM_DESCRIPTION, ORDERBY as FORM_ORDER from HRFORMS2_FORM_CODES) f on (pt.FORM_CODE = f.FORM_CODE)
            left join (select ACTION_CODE, ACTION_TITLE, ACTION_DESCRIPTION, ORDERBY as ACTION_ORDER from HRFORMS2_ACTION_CODES) a on (pt.ACTION_CODE = a.ACTION_CODE)
            left join (select TRANSACTION_CODE, TRANSACTION_TITLE, TRANSACTION_DESCRIPTION, ORDERBY as TRANSACTION_ORDER from HRFORMS2_TRANSACTION_CODES) t on (pt.TRANSACTION_CODE = t.TRANSACTION_CODE)";
        if (isset($this->req[0])) $qry .= " WHERE pt.payroll_code = :payroll_code";
        if (isset($this->req[1])) $qry .= " AND pt.form_code = :form_code";
        if (isset($this->req[2])) $qry .= " AND pt.action_code = :action_code";
        $qry .= " ORDER BY f.form_order, f.form_title, a.action_order, a.action_title, t.transaction_order, t.transaction_title";
        $stmt = oci_parse($this->db,$qry);
        if (isset($this->req[0])) oci_bind_by_name($stmt,":payroll_code", $this->req[0]);
        if (isset($this->req[1])) oci_bind_by_name($stmt,":form_code", $this->req[1]);
        if (isset($this->req[2])) oci_bind_by_name($stmt,":action_code", $this->req[2]);
        $r = oci_execute($stmt);
        if (!$r) $this->raiseError();
        while ($row = oci_fetch_array($stmt,OCI_ASSOC+OCI_RETURN_NULLS+OCI_RETURN_LOBS)) {
            $row['TABS'] = json_decode($row['TABS']);
            $this->_arr[] = $row;
        }
        $this->returnData = $this->null2Empty($this->_arr);
        if ($this->retJSON) $this->toJSON($this->returnData);
    }

    function POST() {
        $qry = "INSERT INTO HRFORMS2_PAYROLL_TRANSACTIONS 
            values(HRFORMS2_PAYTRANS_ID_SEQ.nextval,:payroll_code,:form_code,:action_code,:transaction_code,:active,:available_for,EMPTY_CLOB(),:route_by,:pr_required)
            RETURNING PAYTRANS_ID,TABS into :paytrans_id,:tabs";
        $stmt = oci_parse($this->db,$qry);
        $clob = oci_new_descriptor($this->db, OCI_D_LOB);
        oci_bind_by_name($stmt,":payroll_code", $this->POSTvars['PAYROLL_CODE']);
        oci_bind_by_name($stmt,":form_code", $this->POSTvars['FORM_CODE']);
        oci_bind_by_name($stmt,":action_code", $this->POSTvars['ACTION_CODE']);
        oci_bind_by_name($stmt,":transaction_code", $this->POSTvars['TRANSACTION_CODE']);
        oci_bind_by_name($stmt,":active", $this->POSTvars['ACTIVE']);
        oci_bind_by_name($stmt,":route_by", $this->POSTvars['ROUTE_BY']);
        oci_bind_by_name($stmt,":pr_required", $this->POSTvars['PR_REQUIRED']);
        oci_bind_by_name($stmt,":available_for", $this->POSTvars['AVAILABLE_FOR']);
        oci_bind_by_name($stmt,":paytrans_id", $PAYTRANS_ID,-1,SQLT_INT);
        oci_bind_by_name($stmt,":tabs", $clob, -1, OCI_B_CLOB);
        $r = oci_execute($stmt,OCI_NO_AUTO_COMMIT);
        if (!$r) $this->raiseError();
        $clob->save(json_encode($this->POSTvars['TABS']));
        oci_commit($this->db);
        oci_free_statement($stmt);
        $this->toJSON(array("PAYTRANS_ID"=>$PAYTRANS_ID));
    }
    function PUT() {
        /* cannot update codes, only active and tabs [TBD] */
        $qry = "UPDATE HRFORMS2_PAYROLL_TRANSACTIONS
            SET active = :active,
            pr_required = :pr_required,
            route_by = :route_by,
            available_for = :available_for,
            tabs = ".((INSTANCE=="LOCAL")?"'{}'":"EMPTY_CLOB()")."
            WHERE paytrans_id = :paytrans_id
            RETURNING TABS into :tabs";
        $stmt = oci_parse($this->db,$qry);
        $clob = oci_new_descriptor($this->db, OCI_D_LOB);
        oci_bind_by_name($stmt,":active", $this->POSTvars['ACTIVE']);
        oci_bind_by_name($stmt,":pr_required", $this->POSTvars['PR_REQUIRED']);
        oci_bind_by_name($stmt,":route_by", $this->POSTvars['ROUTE_BY']);
        oci_bind_by_name($stmt,":available_for", $this->POSTvars['AVAILABLE_FOR']);
        oci_bind_by_name($stmt,":paytrans_id", $this->req[0]);
        oci_bind_by_name($stmt,":tabs", $clob, -1, OCI_B_CLOB);
        $r = oci_execute($stmt,OCI_NO_AUTO_COMMIT);
        if (!$r) $this->raiseError();
        $clob->save(json_encode($this->POSTvars['TABS']));
        oci_commit($this->db);
        oci_free_statement($stmt);
        $this->done();
    }
    function PATCH() {
        if (isset($this->POSTvars['ACTIVE'])) {
            //make sure the codes are all active
            $qry = "select count(*)
            from hrforms2_payroll_transactions p
            left join (select form_code, active from hrforms2_form_codes) f on (f.form_code = p.form_code)
            left join (select action_code, active from hrforms2_action_codes) a on (a.action_code = p.action_code)
            left join (select transaction_code, active from hrforms2_transaction_codes) t on (t.transaction_code = p.transaction_code)
            where p.paytrans_id = :paytrans_id
            and nvl(f.active,1) = 1
            and nvl(a.active,1) = 1
            and nvl(t.active,1) = 1";
            $stmt = oci_parse($this->db,$qry);
            oci_bind_by_name($stmt,":paytrans_id", $this->req[0]);
            $r = oci_execute($stmt);
            if (!$r) $this->raiseError();
            $row = oci_fetch_array($stmt,OCI_RETURN_NULLS);
            if ($row[0] == 0) $this->raiseError(400,array("errMsg"=>"Dependency is not Active, cannot activate"));

            // Check to see if any forms are using the paytrans_id
            $qry = "select sum(c) from (
                select count(*) as c from hrforms2_forms_drafts d where d.data.formActions.PAYTRANS_ID = :paytrans_id
                union
                select count(*) as c from hrforms2_forms f where f.form_data.formActions.PAYTRANS_ID = :paytrans_id
            )";
            $stmt = oci_parse($this->db,$qry);
            oci_bind_by_name($stmt,":paytrans_id", $this->req[0]);
            $r = oci_execute($stmt);
            if (!$r) $this->raiseError();
            $row = oci_fetch_array($stmt,OCI_NUM+OCI_RETURN_NULLS);
            if ($row[0] != "0") $this->raiseError(E_FORBIDDEN,array("errMsg"=>"Payroll Transaction in use"));
            
            $qry = "UPDATE HRFORMS2_PAYROLL_TRANSACTIONS SET active = :active WHERE paytrans_id = :paytrans_id";
            $stmt = oci_parse($this->db,$qry);
            oci_bind_by_name($stmt,":active", $this->POSTvars['ACTIVE']);
            oci_bind_by_name($stmt,":paytrans_id", $this->req[0]);
            $r = oci_execute($stmt);
            if (!$r) $this->raiseError();
            oci_commit($this->db);
            oci_free_statement($stmt);
        }
        $this->done();
    }
    function DELETE() {
        //check to make sure there are no forms with the code (does not check archived)
        $qry = "select sum(c) from (
            select count(*) as c from hrforms2_forms_drafts d where d.data.formActions.PAYTRANS_ID = :paytrans_id
            union
            select count(*) as c from hrforms2_forms f where f.form_data.formActions.PAYTRANS_ID = :paytrans_id
        )";
        $stmt = oci_parse($this->db,$qry);
        oci_bind_by_name($stmt,":paytrans_id", $this->req[0]);
        $r = oci_execute($stmt);
        if (!$r) $this->raiseError();
        $row = oci_fetch_array($stmt,OCI_NUM+OCI_RETURN_NULLS);
        if ($row[0] != "0") $this->raiseError(E_FORBIDDEN,array("errMsg"=>"Payroll Transaction in use"));
        $qry = "DELETE FROM HRFORMS2_PAYROLL_TRANSACTIONS where paytrans_id = :paytrans_id";
        $stmt = oci_parse($this->db,$qry);
        oci_bind_by_name($stmt,":paytrans_id", $this->req[0]);
        $r = oci_execute($stmt);
        if (!$r) $this->raiseError();
        oci_commit($this->db);
        oci_free_statement($stmt);
        $this->done();
    }

}
