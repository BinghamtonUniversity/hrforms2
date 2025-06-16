<?php
/*
NB: set $this->reqAuth = false in __construct to allow calls to functions without authentication checks.  Call $this->checkAuth() from functions to selectively restrict access.

NB: HTTP Codes: https://tools.ietf.org/html/rfc7231#section-6
405: Method Not Allowed
501: Not Implemented

NB: HTTP Request Methods: https://tools.ietf.org/html/rfc7231#section-4.3
*/

class Journal extends HRForms2 {
	private $_arr = array();
    private $k = array("id"=>"","master"=>"","journal"=>"");

	function __construct($req,$rjson=true) {
		$this->allowedMethods = "GET,POST"; //default: "" - NB: Add methods here: GET, POST, PUT, PATCH, DELETE
		$this->reqAuth = true; //default: true - NB: See note above
		$this->retJSON = $rjson;
		$this->req = $req;
		$this->init();
	}

    /**
     * helper function to get user name information
     */
    private function getUser(&$row) {
        //TODO: will this work for non-admin users?
        $user = (new user(array($row['SUNY_ID']),false))->returnData;
        if (sizeof($user) == 0) {
            $row['LEGAL_FIRST_NAME'] = 'Missing/Unknown User ('.$row['SUNY_ID'].')';
            $row['LEGAL_MIDDLE_NAME'] = '';
            $row['LEGAL_LAST_NAME'] = '';
            $row['ALIAS_FIRST_NAME'] = '';
        } else {
            $u = array_shift($user);
            $row['LEGAL_FIRST_NAME'] = $u['LEGAL_FIRST_NAME'];
            $row['LEGAL_MIDDLE_NAME'] = $u['LEGAL_MIDDLE_NAME'];
            $row['LEGAL_LAST_NAME'] = $u['LEGAL_LAST_NAME'];
            $row['ALIAS_FIRST_NAME'] = $u['ALIAS_FIRST_NAME'];
        }
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
        if ($this->sessionData['isAdmin'] && $this->sessionData['OVR_SUNY_ID'] == "") return true;
        
        // If isViewer, check dept_code
        if ($this->sessionData['isViewer']) {
            $qry = "select 1
                from ".$this->k['journal']."_last
                where ".$this->k['id']." = :id
                and dept_code in (select department_code from hrforms2_user_departments where suny_id = :suny_id)";
            $stmt = oci_parse($this->db,$qry);
            oci_bind_by_name($stmt,":suny_id",$this->sessionData['EFFECTIVE_SUNY_ID']);
        } else {
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
            oci_bind_by_name($stmt,":suny_id",$this->sessionData['EFFECTIVE_SUNY_ID']);
        }
        oci_bind_by_name($stmt,":id",$this->req[1]);
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
        // if the journal is archived; get the group names at time of creation for the request/form
        if ($this->k['archive']) {
            $gh = (new groupshistory($this->req,false))->returnData;
            $group_ids = array_column($gh,'GROUP_ID');
        }
        $qry = "select j.".$this->k['id'].", b.created_by_suny_id, j.suny_id,
        to_char(j.journal_date,'DD-MON-YYYY HH24:MI:SS') as journal_date,
        j.suny_id, status, hierarchy_id, workflow_id, sequence, 
        group_from, gf.group_name as GROUP_FROM_NAME, gf.group_description as GROUP_FROM_DESCRIPTION,
        group_to, gt.group_name as GROUP_TO_NAME, gt.group_description as GROUP_TO_DESCRIPTION,
        comments
        from ".$this->k['journal']." j
        join (select a.".$this->k['id'].", a.created_by.SUNY_ID as created_by_suny_id from ".$this->k['master']." a) b on (b.".$this->k['id']." = j.".$this->k['id'].")
        left join (select group_id, group_name, group_description from hrforms2_groups) gf on (j.group_from = gf.group_id)
        left join (select group_id, group_name, group_description from hrforms2_groups) gt on (j.group_to = gt.group_id)
        where j.".$this->k['id']." = :id
        order by sequence";
        $stmt = oci_parse($this->db,$qry);
        oci_bind_by_name($stmt,":id",$this->req[1]);
        $r = oci_execute($stmt);
        if (!$r) $this->raiseError();
        while ($row = oci_fetch_array($stmt,OCI_ASSOC+OCI_RETURN_NULLS+OCI_RETURN_LOBS)) {
            if ($this->k['archive']) {
                if ($row['GROUP_FROM']) {
                    $key = array_search($row['GROUP_FROM'],$group_ids);
                    $row['GROUP_FROM_NAME'] = $gh[$key]['GROUP_NAME'];
                    $row['GROUP_FROM_DESCRIPTION'] = $gh[$key]['GROUP_DESCRIPTION'];
                }
                if ($row['GROUP_TO']) {
                    $key = array_search($row['GROUP_TO'],$group_ids);
                    $row['GROUP_TO_NAME'] = $gh[$key]['GROUP_NAME'];
                    $row['GROUP_TO_DESCRIPTION'] = $gh[$key]['GROUP_DESCRIPTION'];
                }
            }
            $this->_arr[] = $row;
        }
        
        $ids = array_values(array_unique(array_column($this->_arr,'SUNY_ID')));
        array_walk($ids,function(&$id) {
            $id = array('SUNY_ID' => $id);
            $this->getUser($id);
        });

        $keys = array_column($ids, 'SUNY_ID');
        array_walk($this->_arr,function(&$row) use($keys,$ids) {
            $key = array_search($row['SUNY_ID'],$keys);
            $row = array_merge($row,$ids[$key]);
        });

        oci_free_statement($stmt);
        $this->returnData = $this->null2Empty($this->_arr);
        if ($this->retJSON) $this->toJSON($this->returnData);
	}

    function POST() {
        $qry = "insert into ".$this->k['journal']." 
        values(:id, systimestamp, :suny_id, :status, :hierarchy_id, :workflow_id, :seq, :group_from, :group_to,".((INSTANCE=="LOCAL")?"' '":"EMPTY_CLOB()").")
        returning COMMENTS into :comments";
        $stmt = oci_parse($this->db,$qry);
        $comments = oci_new_descriptor($this->db, OCI_D_LOB);
        oci_bind_by_name($stmt,":id", $this->req[1]);
        oci_bind_by_name($stmt,":status", $this->req[2]);
        oci_bind_by_name($stmt,":suny_id", $this->sessionData['EFFECTIVE_SUNY_ID']);
        oci_bind_by_name($stmt,":hierarchy_id", $this->req[3]['hierarchy_id']);
        oci_bind_by_name($stmt,":workflow_id", $this->req[3]['workflow_id']);
        oci_bind_by_name($stmt,":seq", $this->req[3]['seq']);
        oci_bind_by_name($stmt,":group_from", $this->req[3]['group_from']);
        oci_bind_by_name($stmt,":group_to", $this->req[3]['group_to']);
        oci_bind_by_name($stmt,":comments", $comments, -1, OCI_B_CLOB);
        $r = oci_execute($stmt,OCI_NO_AUTO_COMMIT);
        if (!$r) $this->raiseError();
        $comments->save($this->req[3]['comment']);
        oci_commit($this->db);
        if ($this->retJSON) $this->done();
    }

    function PATCH() {
        // update journal status 
        $qry = "update ".$this->k['journal']."
            set STATUS = :new_status, 
            JOURNAL_DATE = systimestamp,
            SUNY_ID = :suny_id";
        if (!empty($this->req[5])) $qry .= ",COMMENTS = " . ((INSTANCE!="LOCAL")?"' '":"EMPTY_CLOB()");
        $qry .= " where ".$this->k['id']." = :id
            and sequence = :seq
            and STATUS = :old_status";
        if (!empty($this->req[5])) $qry .= " returning COMMENTS into :comments";
        $stmt = oci_parse($this->db,$qry);
        $comments = oci_new_descriptor($this->db, OCI_D_LOB);
        oci_bind_by_name($stmt,":id", $this->req[1]);
        oci_bind_by_name($stmt,":seq", $this->req[2]);
        oci_bind_by_name($stmt,":old_status", $this->req[3]);
        oci_bind_by_name($stmt,":new_status", $this->req[4]);
        oci_bind_by_name($stmt,":suny_id", $this->sessionData['EFFECTIVE_SUNY_ID']);
        if (!empty($this->req[5])) oci_bind_by_name($stmt,":comments", $comments, -1, OCI_B_CLOB);
        $r = oci_execute($stmt,OCI_NO_AUTO_COMMIT);
        if (!$r) $this->raiseError();
        if (oci_num_rows($stmt) == 0) {
            oci_free_statement($stmt);
            $this->raiseError(E_BAD_REQUEST,array("errMsg"=>"No journal entry found for this request/form with the specified sequence and status."));
        }
        if (!empty($this->req[5])) $comments->save($this->req[5]);
        oci_commit($this->db);
        if ($this->retJSON) $this->done();
    }

}
