<?php
/*
NB: set $this->reqAuth = false in __construct to allow calls to functions without authentication checks.  Call $this->checkAuth() from functions to selectively restrict access.

NB: HTTP Codes: https://tools.ietf.org/html/rfc7231#section-6
405: Method Not Allowed
501: Not Implemented

NB: HTTP Request Methods: https://tools.ietf.org/html/rfc7231#section-4.3
*/

class Hierarchy extends HRForms2 {
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
		// Validation...
	}

	/* create functions GET,POST,PUT,PATCH,DELETE as needed - defaults provided from init reflection method */
	function GET() {
        include 'groups.php';
        $groups = (new Groups(array(),false))->returnData;

        function map_group(&$item,$key,$groups) {
            if ($item == '') return;
            $k = array_search($item, array_column($groups, 'GROUP_ID'));
            $item = array('GROUP_ID'=>$item,'GROUP_NAME'=>$groups[$k]['GROUP_NAME']);
        }

        $qry = "select h.HIERARCHY_ID,h.POSITION_TYPE,h.GROUP_ID,g.GROUP_NAME,h.WORKFLOW_ID,w.GROUPS
        from hrforms2_requests_hierarchy h
        left join (select * from hrforms2_groups) g on (h.group_id = g.group_id)
        left join (select * from hrforms2_requests_workflow) w on (h.workflow_id = w.workflow_id)";
		$stmt = oci_parse($this->db,$qry);
		$r = oci_execute($stmt);
		if (!$r) $this->raiseError();
		while ($row = oci_fetch_array($stmt,OCI_ASSOC+OCI_RETURN_NULLS)) {
            //$grp_array = explode(',',$row['GROUPS']);
            //array_walk($grp_array,'map_group',$groups);
            //$row['GROUPS_ARRAY'] = $grp_array;
            $this->_arr[] = $row;
		}
		oci_free_statement($stmt);
		$this->returnData = $this->_arr;
		if ($this->retJSON) $this->toJSON($this->returnData);
	}
}
