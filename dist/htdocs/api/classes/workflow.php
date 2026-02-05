<?php
/*
NB: set $this->reqAuth = false in __construct to allow calls to functions without authentication checks.  Call $this->checkAuth() from functions to selectively restrict access.

NB: HTTP Codes: https://tools.ietf.org/html/rfc7231#section-6
405: Method Not Allowed
501: Not Implemented

NB: HTTP Request Methods: https://tools.ietf.org/html/rfc7231#section-4.3
*/

class Workflow extends HRForms2 {
    private $_arr = array();
    private $table = "";

    function __construct($req,$rjson=true) {
        $this->allowedMethods = "GET,POST,PUT,DELETE"; //default: "" - NB: Add methods here: GET, POST, PUT, PATCH, DELETE
        $this->reqAuth = true; //default: true - NB: See note above
        $this->retJSON = $rjson;
        $this->req = $req;
        $this->init();
    }

    private function __save_history() {
        $hist_table = $this->table . "_history";
        # To avoid collision of history and current when doing an update (PUT), we set history_date back by 1 second
        $qry = "insert into $hist_table select w.*, :method, sysdate-(1/86400) from $this->table w where workflow_id = :id";
        $stmt = oci_parse($this->db,$qry);
        oci_bind_by_name($stmt,":id", $this->req[1]);
        oci_bind_by_name($stmt,":method", $this->method);
        $r = oci_execute($stmt);
        if (!$r) $this->raiseError();
        oci_free_statement($stmt);
    }

    /**
     * validate called from init()
     */
    function validate() {
        if (in_array($this->method,array('PUT','PATCH','DELETE')) && !$this->sessionData['isAdmin']) $this->raiseError(E_FORBIDDEN,array("errMsg"=>"Insufficient privileges"));
        if (in_array($this->method,array('PUT','PATCH','DELETE')) && !isset($this->req[1])) $this->raiseError(E_BAD_REQUEST,array("errMsg"=>"Missing Workflow ID"));
        switch($this->req[0]) {
            case "request": /** Request Work Flows */
                $this->table = "hrforms2_requests_workflow";
                break;
            case "form": /** Form Work Flows */
                $this->table = "hrforms2_forms_workflow";
                break;
            default:
                $this->raiseError(E_BAD_REQUEST,array("errMsg"=>"Missing Workflow Type"));
        }
    }

    /* create functions GET,POST,PUT,PATCH,DELETE as needed - defaults provided from init reflection method */
    function GET() {
        $qry = "with workflow as (
            select workflow_id, groups, CONDITIONS, sendtogroup, sysdate as history_date
            from $this->table
            union all
            select workflow_id, groups, CONDITIONS, sendtogroup, history_date
            from {$this->table}_history
        ) select * from workflow";
        if (isset($this->req[1])) {
             $qry .= " where workflow_id = :id";
        } else {
             $qry .= " where history_date >= sysdate";
        }
        if (isset($this->req[2])) $qry .= " and history_date >= to_date(:hist_date)";
        $qry .= " order by workflow_id, history_date desc";
        if (isset($this->req[1])) $qry .= " fetch first 1 row only"; //only one when looking for specific id)
        $stmt = oci_parse($this->db,$qry);
        if (isset($this->req[1])) oci_bind_by_name($stmt,":id", $this->req[1]);
        if (isset($this->req[2])) oci_bind_by_name($stmt,":hist_date", $this->req[2]);
        $r = oci_execute($stmt);
        if (!$r) $this->raiseError();
        while ($row = oci_fetch_array($stmt,OCI_ASSOC+OCI_RETURN_NULLS+OCI_RETURN_LOBS)) {
            $row['CONDITIONS'] = json_decode($row['CONDITIONS']);
            $this->_arr[] = $row;
        }
        oci_free_statement($stmt);
        $this->returnData = $this->null2Empty($this->_arr);
        if ($this->retJSON) $this->toJSON($this->returnData);
    }
    function POST() {
        $qry = "insert into $this->table values({$this->table}_SEQ.nextval,:groups,EMPTY_CLOB(),:sendtogroup) 
        returning WORKFLOW_ID, CONDITIONS INTO :workflow_id, :conditions";
        $stmt = oci_parse($this->db,$qry);
        $clob = oci_new_descriptor($this->db, OCI_D_LOB);
        oci_bind_by_name($stmt,":groups", $this->POSTvars['GROUPS']);
        oci_bind_by_name($stmt,":workflow_id", $WORKFLOW_ID,-1,SQLT_INT);
        oci_bind_by_name($stmt,":conditions", $clob, -1, OCI_B_CLOB);
        oci_bind_by_name($stmt,":sendtogroup", $this->POSTvars['SENDTOGROUP']);
        $r = oci_execute($stmt,OCI_NO_AUTO_COMMIT);
        if (!$r) $this->raiseError();
        $clob->save(json_encode($this->POSTvars['CONDITIONS']));
        oci_commit($this->db);
        oci_free_statement($stmt);
        $this->toJSON(array("WORKFLOW_ID"=>$WORKFLOW_ID));
    }
    function PUT() {
        $this->__save_history();
        $qry = "update $this->table set groups = :groups, CONDITIONS = EMPTY_CLOB(),
        sendtogroup = :sendtogroup
        where workflow_id = :workflow_id returning CONDITIONS into :conditions";
        $stmt = oci_parse($this->db,$qry);
        $clob = oci_new_descriptor($this->db, OCI_D_LOB);
        oci_bind_by_name($stmt,":groups", $this->POSTvars['GROUPS']);
        oci_bind_by_name($stmt,":workflow_id", $this->req[1]);
        oci_bind_by_name($stmt,":conditions", $clob, -1, OCI_B_CLOB);
        oci_bind_by_name($stmt,":sendtogroup", $this->POSTvars['SENDTOGROUP']);
        $r = oci_execute($stmt,OCI_NO_AUTO_COMMIT);
        if (!$r) $this->raiseError();
        $clob->save(json_encode($this->POSTvars['CONDITIONS']));
        oci_commit($this->db);
        oci_free_statement($stmt);
        $this->done();
    }
    function DELETE() {
        $this->__save_history();
        $qry = "delete from $this->table where workflow_id = :workflow_id";
        $stmt = oci_parse($this->db,$qry);
        oci_bind_by_name($stmt,":workflow_id", $this->req[1]);
        $r = oci_execute($stmt);
        if (!$r) $this->raiseError();
        oci_commit($this->db);
        oci_free_statement($stmt);
        $this->done();
    }
}
