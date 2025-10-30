<?php
/*
NB: set $this->reqAuth = false in __construct to allow calls to functions without authentication checks.  Call $this->checkAuth() from functions to selectively restrict access.

NB: HTTP Codes: https://tools.ietf.org/html/rfc7231#section-6
405: Method Not Allowed
501: Not Implemented

NB: HTTP Request Methods: https://tools.ietf.org/html/rfc7231#section-4.3
*/

class Lists extends HRForms2 {
    private $_arr = array();

    function __construct($req,$rjson=true) {
        $this->allowedMethods = "GET,POST,PUT,DELETE"; //default: "" - NB: Add methods here: GET, POST, PUT, PATCH, DELETE
        $this->reqAuth = true; //default: true - NB: See note above
        $this->retJSON = $rjson;
        $this->req = $req;
        $this->init();
    }

    /**
     * validate called from init()
     */
    function validate() {
        if ($this->method != 'GET' && !$this->sessionData['isAdmin']) $this->raiseError(403);
        if (($this->method == 'PUT' || $this->method == 'DELETE') && !isset($this->req[0])) $this->raiseError(E_BAD_REQUEST);
    }

    /* create functions GET,POST,PUT,PATCH,DELETE as needed - defaults provided from init reflection method */
    function GET() {
        if (isset($this->req[0])) {
            $qry = "select * from hrforms2_lists where list_id = :list_id";
            $stmt = oci_parse($this->db,$qry);
            oci_bind_by_name($stmt,":list_id",$this->req[0]);
            oci_execute($stmt);
            $row = oci_fetch_array($stmt,OCI_ASSOC+OCI_RETURN_NULLS+OCI_RETURN_LOBS);
            $this->_arr = $row;
            $this->_arr['LIST_DATA'] = $row['LIST_DATA'];
        } else {
            $qry = "select LIST_ID,LIST_NAME,LIST_SLUG from hrforms2_lists order by LIST_NAME";
            $stmt = oci_parse($this->db,$qry);
            oci_execute($stmt);
            oci_fetch_all($stmt,$this->_arr,null,null,OCI_FETCHSTATEMENT_BY_ROW);
        }
        $this->_arr = $this->null2Empty($this->_arr);
        $this->returnData = $this->_arr;
        if ($this->retJSON) $this->toJSON($this->returnData);
    }
    function POST() {
        $qry = "insert into hrforms2_lists (LIST_ID,LIST_NAME,LIST_TYPE,LIST_SLUG,PROTECTED,LIST_DATA) 
            values(HRFORMS2_LIST_ID_SEQ.nextval,:list_name,:list_type,:list_slug,0,EMPTY_CLOB())
            returning LIST_ID, LIST_DATA into :list_id, :list_data";
        $stmt = oci_parse($this->db,$qry);
        $clob = oci_new_descriptor($this->db, OCI_D_LOB);
        oci_bind_by_name($stmt, ":list_name", $this->POSTvars['LIST_NAME']);
        oci_bind_by_name($stmt, ":list_type", $this->POSTvars['LIST_TYPE']);
        oci_bind_by_name($stmt, ":list_slug", $this->POSTvars['LIST_SLUG']);
        oci_bind_by_name($stmt, ":list_data", $clob, -1, OCI_B_CLOB);
        oci_bind_by_name($stmt, ":list_id", $list_id, -1, SQLT_INT);
        oci_execute($stmt,OCI_DEFAULT);
        $clob->save($this->POSTvars['LIST_DATA']);
        oci_commit($this->db);
        $this->toJSON(array(LIST_ID=>$list_id));
    }
    function PUT() {
        $qry = "update hrforms2_lists set LIST_NAME = :list_name, LIST_TYPE = :list_type, LIST_SLUG = :list_slug, 
            LIST_DATA = EMPTY_CLOB() where LIST_ID = :list_id returning LIST_DATA into :list_data";
        $stmt = oci_parse($this->db,$qry);
        $clob = oci_new_descriptor($this->db, OCI_D_LOB);
        oci_bind_by_name($stmt, ":list_id", $this->req[0]);
        oci_bind_by_name($stmt, ":list_name", $this->POSTvars['LIST_NAME']);
        oci_bind_by_name($stmt, ":list_type", $this->POSTvars['LIST_TYPE']);
        oci_bind_by_name($stmt, ":list_slug", $this->POSTvars['LIST_SLUG']);
        oci_bind_by_name($stmt, ":list_data", $clob, -1, OCI_B_CLOB);
        oci_execute($stmt,OCI_DEFAULT);
        $clob->save($this->POSTvars['LIST_DATA']);
        oci_commit($this->db);
        $this->done();
    }
    function DELETE() {
        $qry = "delete from hrforms2_lists where LIST_ID = :list_id";
        $stmt = oci_parse($this->db,$qry);
        oci_bind_by_name($stmt, ":list_id", $this->req[0]);
        oci_execute($stmt,OCI_DEFAULT);
        oci_commit($this->db);
        $this->done();
    }
}
