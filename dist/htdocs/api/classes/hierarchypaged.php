<?php
/*
NB: set $this->reqAuth = false in __construct to allow calls to functions without authentication checks.  Call $this->checkAuth() from functions to selectively restrict access.

NB: HTTP Codes: https://tools.ietf.org/html/rfc7231#section-6
405: Method Not Allowed
501: Not Implemented

NB: HTTP Request Methods: https://tools.ietf.org/html/rfc7231#section-4.3
*/

class HierarchyPaged extends HRForms2 {
    private $_arr = array();
    private $table = "";
    private $key2 = "";

    function __construct($req,$rjson=true) {
        $this->allowedMethods = "GET,POST,PATCH,DELETE"; //default: "" - NB: Add methods here: GET, POST, PUT, PATCH, DELETE
        $this->reqAuth = true; //default: true - NB: See note above
        $this->retJSON = $rjson;
        $this->req = $req;
        $this->init();
    }

    private function __save_history() {
        # To avoid collision of history and current when doing an update (PUT), we set history_date back by 1 second
        $hist_table = $this->table . "_history";
        $qry = "insert into $hist_table select h.*, :method, sysdate-(1/86400) from $this->table h where hierarchy_id = :id";
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
        if (in_array($this->method,array('PUT','PATCH','DELETE')) && !isset($this->req[1])) $this->raiseError(400);
        switch($this->req[0]) {
            case "request": /** Request Hierarchy */
                $this->table = "hrforms2_requests_hierarchy";
                $this->key2 = $this->POSTvars['posType'];
                break;
            case "form": /** Form Hierarchy */
                $this->table = "hrforms2_forms_hierarchy";
                $this->key2 = $this->POSTvars['formCode'];
                break;
            default:
                $this->raiseError(400);
        }
    }

    /* create functions GET,POST,PUT,PATCH,DELETE as needed - defaults provided from init reflection method */
    function GET() {
        // set defaults
        $page = 1;
        $results = 10;
        extract($_GET);
        $offset = ($results=='all')?0:($page-1)*$results;
        
        switch($this->req[0]) {
            case "request": /** Request Hierarchy */
                // get total rows
                $qry = "select count(*) from hrforms2_requests_hierarchy";
                $stmt = oci_parse($this->db,$qry);
                $r = oci_execute($stmt);
                if (!$r) $this->raiseError();
                [$total] = oci_fetch_array($stmt,OCI_NUM);
                oci_free_statement($stmt);
                if ($results=='all') $results = $total;

                $qry = "select h.HIERARCHY_ID,h.POSITION_TYPE,h.WORKFLOW_ID,h.groups as hierarchy_groups,
                                w.GROUPS as workflow_groups,w.CONDITIONS
                    from hrforms2_requests_hierarchy h
                    left join (select * from hrforms2_requests_workflow) w on (h.workflow_id = w.workflow_id)
                    offset $offset rows
                    fetch next $results rows only";	
                //TODO: is this used?
                if (isset($this->req[1])&&$this->req[1]!='group') {
                    $qry .= " where h.hierarchy_id = :id";
                    $id = $this->req[1];
                }
                $stmt = oci_parse($this->db,$qry);
                if (isset($this->req[1])) oci_bind_by_name($stmt,":id", $id);
                $r = oci_execute($stmt);
                if (!$r) $this->raiseError();
                while ($row = oci_fetch_array($stmt,OCI_ASSOC+OCI_RETURN_LOBS)) {
                    if ($this->req[1] == 'group') {
                        $hgroups = explode(',',$row['HIERARCHY_GROUPS']);
                        if (!in_array($this->req[2],$hgroups)) continue;
                    }
                    $row['CONDITIONS'] = json_decode($row['CONDITIONS']);
                    $this->_arr[] = $row;
                }
                oci_free_statement($stmt);
                
                // get default when selecting for group:
                if ($this->req[1] == 'group') {
                    $qry = "select 0 as HIERARCHY_ID,null as POSITION_TYPE,
                        w.workflow_id, w.groups as workflow_groups, w.conditions
                        from hrforms2_requests_workflow w
                        left join (select * from hrforms2_groups) g on (g.group_id = :id)
                        where w.workflow_id = (select s.settings.requests.defaultWorkflow from hrforms2_settings s)";
                    $stmt = oci_parse($this->db,$qry);
                    if (isset($this->req[1])) oci_bind_by_name($stmt,":id", $id);
                    $r = oci_execute($stmt);
                    if (!$r) $this->raiseError();
                    while ($row = oci_fetch_array($stmt,OCI_ASSOC+OCI_RETURN_NULLS+OCI_RETURN_LOBS)) {
                        $row['CONDITIONS'] = json_decode($row['CONDITIONS']);
                        $this->_arr[] = $row;
                    }
                    oci_free_statement($stmt);
                }

                break;

            case "form": /** Form Hierarchy */
                // get total rows
                $qry = "select count(*) from hrforms2_forms_hierarchy";
                $stmt = oci_parse($this->db,$qry);
                $r = oci_execute($stmt);
                if (!$r) $this->raiseError();
                [$total] = oci_fetch_array($stmt,OCI_NUM);
                oci_free_statement($stmt);
                if ($results=='all') $results = $total;

                $qry = "select 
                    h.HIERARCHY_ID,h.PAYTRANS_ID, 
                    p.payroll_code, pay.payroll_title, pay.payroll_description, pay.active as payroll_active,
                    p.form_code, f.form_title, f.form_description, f.active as form_code_active,
                    p.action_code, a.action_title, a.action_description, a.active as action_code_active,
                    p.transaction_code, t.transaction_title, t.transaction_description, t.active as transaction_code_active,
                    p.active as paytrans_active, p.available_for,
                    h.GROUPS as hierarchy_groups,h.WORKFLOW_ID,
                    w.GROUPS as workflow_groups,w.CONDITIONS,w.SENDTOGROUP
                    from hrforms2_forms_hierarchy h
                    left join (select * from hrforms2_payroll_transactions) p on (h.paytrans_id = p.paytrans_id)
                    left join (select * from hrforms2_forms_workflow) w on (h.workflow_id = w.workflow_id)
                    left join (select * from hrforms2_payroll_codes) pay on (p.payroll_code = pay.payroll_code)
                    left join (select * from hrforms2_form_codes) f on (p.form_code = f.form_code)
                    left join (select * from hrforms2_action_codes) a on (p.action_code = a.action_code)
                    left join (select * from hrforms2_transaction_codes) t on (p.transaction_code = t.transaction_code)
                    offset $offset rows
                    fetch next $results rows only";
                $stmt = oci_parse($this->db,$qry);
                $r = oci_execute($stmt);
                if (!$r) $this->raiseError();
                while ($row = oci_fetch_array($stmt,OCI_ASSOC+OCI_RETURN_NULLS+OCI_RETURN_LOBS)) {
                    if ($this->req[1] == 'group') {
                        $hgroups = explode(',',$row['HIERARCHY_GROUPS']);
                        if (!in_array($this->req[2],$hgroups)) continue;
                    }
                    $row['CONDITIONS'] = json_decode($row['CONDITIONS']);
                    $this->_arr[] = $row;
                }
                oci_free_statement($stmt);

                // get default when selecting for group:
                if ($this->req[1] == 'group') {
                    $qry = "select 0 as HIERARCHY_ID,w.workflow_id, w.groups as WORKFLOW_GROUPS, 
                        'N' as SENDTOGROUP, w.conditions
                        from hrforms2_forms_workflow w
                        left join (select * from hrforms2_groups) g on (g.group_id = :id)
                        where w.workflow_id = (select s.settings.forms.defaultWorkflow from hrforms2_settings s)";
                    $stmt = oci_parse($this->db,$qry);
                    if (isset($this->req[1])) oci_bind_by_name($stmt,":id", $id);
                    $r = oci_execute($stmt);
                    if (!$r) $this->raiseError();
                    while ($row = oci_fetch_array($stmt,OCI_ASSOC+OCI_RETURN_NULLS+OCI_RETURN_LOBS)) {
                        $row['CONDITIONS'] = json_decode($row['CONDITIONS']);
                        $this->_arr[] = $row;
                    }
                    oci_free_statement($stmt);
                }
                break;
            default:
                $this->raiseError(E_BAD_REQUEST);
        }
        $this->returnData = array(
            "results" => $this->_arr,
            "info" => array(
                "page" => $page,
                "results" => $results,
                "offset" => $offset,
                "total_rows" => $total	
            )
        );
        if ($this->retJSON) $this->toJSON($this->returnData);
    }
    function POST() {
        $qry = "insert into $this->table 
        values({$this->table}_SEQ.nextval, :key2, :workflow_id, :groups)
        returning HIERARCHY_ID into :hierarchy_id";
        $stmt = oci_parse($this->db,$qry);
        oci_bind_by_name($stmt,":key2", $this->key2);
        oci_bind_by_name($stmt,":workflow_id", $this->POSTvars['workflowId']);
        oci_bind_by_name($stmt,":groups", $this->POSTvars['groups']);
        oci_bind_by_name($stmt,":hierarchy_id", $HIERARCHY_ID,-1,SQLT_INT);
        $r = oci_execute($stmt);
        if (!$r) $this->raiseError();
        oci_free_statement($stmt);
        $this->toJSON(array("HIERARCHY_ID"=>$HIERARCHY_ID));
    }
    function PATCH() {
        $this->__save_history();
        $qry = "update $this->table 
        set workflow_id = :workflow_id, groups = :groups
        where hierarchy_id = :hierarchy_id";
        $stmt = oci_parse($this->db,$qry);
        oci_bind_by_name($stmt,":workflow_id", $this->POSTvars['workflowId']);
        oci_bind_by_name($stmt,":groups", $this->POSTvars['groups']);
        oci_bind_by_name($stmt,":hierarchy_id", $this->req[1]);
        $r = oci_execute($stmt);
        if (!$r) $this->raiseError();
        oci_commit($this->db);
        oci_free_statement($stmt);
        $this->done();
    }
    function DELETE() {
        $this->__save_history();
        $qry = "delete from $this->table where hierarchy_id = :hierarchy_id";
        $stmt = oci_parse($this->db,$qry);
        oci_bind_by_name($stmt,":hierarchy_id", $this->req[1]);
        $r = oci_execute($stmt);
        if (!$r) $this->raiseError();
        oci_commit($this->db);
        oci_free_statement($stmt);
        $this->done();
    }
}
