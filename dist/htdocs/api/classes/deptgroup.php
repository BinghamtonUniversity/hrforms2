<?php
/*
NB: set $this->reqAuth = false in __construct to allow calls to functions without authentication checks.  Call $this->checkAuth() from functions to selectively restrict access.

NB: HTTP Codes: https://tools.ietf.org/html/rfc7231#section-6
405: Method Not Allowed
501: Not Implemented

NB: HTTP Request Methods: https://tools.ietf.org/html/rfc7231#section-4.3
*/

class DeptGroup extends HRForms2 {
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
        //if (!isset($this->req[0])) $this->raiseError(400);
    }

    /* create functions GET,POST,PUT,PATCH,DELETE as needed - defaults provided from init reflection method */
    function GET() {
        $qry = "select distinct d.department_code,
        regexp_replace(d.department_desc,'([[:digit:]] [[:digit:]]{3}) (.*)','\\2 (\\1)') as department_desc,
        regexp_replace(d.department_desc,'([[:digit:]] [[:digit:]]{3}) (.*)','\\2') as department_name,
        gd.group_id, g.group_name, g.start_date, g.end_date,g.group_description
        from sunyhr.campus_departments@banner.cc.binghamton.edu d
        left join (select department_code, group_id from hrforms2_group_departments) gd on (gd.department_code = d.department_code)
        left join (select group_id, group_name, start_date, end_date, group_description from hrforms2_groups) g on (g.group_id = gd.group_id)
        where d.data_status = 'C' and d.department_code <> '999999999'";
        if (isset($this->req[0])) $qry .= " and d.department_code = :department_code";
        $qry .= " order by regexp_replace(d.department_desc,'([[:digit:]] [[:digit:]]{3}) (.*)','\\2 (\\1)')";
        $stmt = oci_parse($this->db,$qry);
        if (isset($this->req[0])) oci_bind_by_name($stmt,":department_code", $this->req[0]);
        $r = oci_execute($stmt);
        if (!$r) $this->raiseError();
        if (isset($this->req[0])) {
            $row = oci_fetch_array($stmt,OCI_ASSOC+OCI_RETURN_NULLS);
            $this->returnData = $row;
        } else {
            oci_fetch_all($stmt,$this->_arr,null,null,OCI_FETCHSTATEMENT_BY_ROW);
            $this->returnData = $this->null2Empty($this->_arr);
        }
        if ($this->retJSON) $this->toJSON($this->returnData);
    }
    
    function PUT() {
        // insert or update
        $qry = "select count(*) from hrforms2_group_departments where department_code = :dept_code";
        $stmt = oci_parse($this->db,$qry);
        oci_bind_by_name($stmt,":dept_code", $this->req[0]);
        $r = oci_execute($stmt);
        if (!$r) $this->raiseError();
        $row = oci_fetch_array($stmt,OCI_RETURN_NULLS);
        if ($row[0] != 0) {
            //update
            $qry = "update hrforms2_group_departments set group_id = :group_id where department_code = :dept_code";
            $stmt = oci_parse($this->db,$qry);
            oci_bind_by_name($stmt,":dept_code", $this->req[0]);
            oci_bind_by_name($stmt,":group_id", $this->POSTvars['primaryGroup']);
        } else {
            //insert
            $qry = "insert into hrforms2_group_departments values(:dept_code,:group_id,:dept_desc)";
            $stmt = oci_parse($this->db,$qry);
            oci_bind_by_name($stmt,":dept_code", $this->req[0]);
            oci_bind_by_name($stmt,":group_id", $this->POSTvars['primaryGroup']);
            oci_bind_by_name($stmt,":dept_desc", $this->POSTvars['DEPARTMENT_DESC']);
        }
        $r = oci_execute($stmt);
        if (!$r) $this->raiseError();
        oci_commit($this->db);
        oci_free_statement($stmt);
        $this->done();
    }

    function DELETE() {
        $qry = "delete from hrforms2_group_departments where department_code = :dept_code";
        $stmt = oci_parse($this->db,$qry);
        oci_bind_by_name($stmt,":dept_code", $this->req[0]);
        $r = oci_execute($stmt);
        if (!$r) $this->raiseError();
        oci_commit($this->db);
        oci_free_statement($stmt);
        $this->done();
    }
}
