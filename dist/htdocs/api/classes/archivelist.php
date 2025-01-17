<?php
/*
NB: set $this->reqAuth = false in __construct to allow calls to functions without authentication checks.  Call $this->checkAuth() from functions to selectively restrict access.

NB: HTTP Codes: https://tools.ietf.org/html/rfc7231#section-6
405: Method Not Allowed
501: Not Implemented

NB: HTTP Request Methods: https://tools.ietf.org/html/rfc7231#section-4.3
*/

class ArchiveList extends HRForms2 {
	private $_arr = array();

	function __construct($req,$rjson=true) {
		$this->allowedMethods = "POST"; //default: "" - NB: Add methods here: GET, POST, PUT, PATCH, DELETE
		$this->reqAuth = true; //default: true - NB: See note above
		$this->retJSON = $rjson;
		$this->req = $req;
		$this->init();
	}

	/**
     * helper function to get user name information
     */
	//TODO: Globalize
    private function setType () {
        //TODO: fix pluralism - make consistent across application
        switch($this->req[0]) {
            case "request":
            case "requests":
                $this->k = array("id"=>"request_id","master"=>"hrforms2_requests_archive","journal"=>"hrforms2_requests_journal_archive");
                break;
            case "form":
            case "forms":
                $this->k = array("id"=>"form_id","master"=>"hrforms2_forms_archive","journal"=>"hrforms2_forms_journal_archive");
                break;
        }
    }

	/**
	 * validate called from init()
	 */
	function validate() {
		$this->setType();
		if ($this->k['id'] == "") $this->raiseError(E_BAD_REQUEST);
	}

	/* create functions GET,POST,PUT,PATCH,DELETE as needed - defaults provided from init reflection method */
	function GET() {
		$page = $_GET['page'] ?? 1;
		$results = $_GET['results'] ?? 10;
		$offset = ($page-1)*$results;

		switch($this->k['id']) {
			case "request_id":
				return $this->done();

			/* FORMS */
			case "form_id":
				$filter = "";
				if ($_GET['startDate']) $filter .= " and trunc(to_timestamp(f.form_data.effDate,'YYYY-MM-DD\"T\"HH24:MI:SS.FF3\"Z\"')) >= :start_date";
				if ($_GET['endDate']) $filter .= " and trunc(to_timestamp(f.form_data.effDate,'YYYY-MM-DD\"T\"HH24:MI:SS.FF3\"Z\"')) <= :end_date";
				if ($_GET['formId'] != "") $filter .= " and f.form_id = :form_id";
				if ($_GET['personName'] != "") {
					$personName = strtolower($_GET['personName']);
					$filter .= " and (lower(nvl(f.form_data.person.information.ALIAS_FIRST_NAME,f.form_data.person.information.LEGAL_FIRST_NAME)) like '%'||:person_name||'%' or lower(f.form_data.person.information.LEGAL_LAST_NAME) like '%'||:person_name||'%')";
				}
				if ($_GET['payroll'] != "") $filter .= " and f.form_data.payroll.PAYROLL_CODE = :payroll";
				if ($_GET['formCode'] != "") $filter .= " and f.form_data.formActions.formCode.FORM_CODE = :formCode";
				if ($_GET['actionCode'] != "") $filter .= " and f.form_data.formActions.actionCode.ACTION_CODE = :actionCode";
				if ($_GET['transactionCode'] != "") $filter .= " and f.form_data.formActions.transactionCode.TRANSACTION_CODE = :transactionCode";
				if ($_GET['lineNumber'] != "") $filter .= " and f.form_data.employment.position.positionDetails.LINE_NUMBER = :line_number";
				if ($_GET['benefitFlag'] != "") $filter .= " and f.form_data.employment.position.BENEFIT_FLAG.id = :benefits_flag";
				if ($_GET['createdBy'] != "") $filter .= " and f.created_by.SUNY_ID = :created_by";

				$sort = "";
				switch($_GET['sortField']) {
					case "fullname":
						$sort = "order by LEGAL_LAST_NAME || ',' || FIRST_NAME " . $_GET['sortDir'] . ", effdate desc";
						break;
					case "form_code":
						$sort = "order by FORM_CODE || '-' || ACTION_CODE || '-' || TRANSACTION_CODE " . $_GET['sortDir'] . ", effdate desc";
						break;
					default:
						$sort = "order by " . $_GET['sortField'] . " " . $_GET['sortDir'];
				}

				$qry = "select count(f.form_id)
					from hrforms2_forms_archive f,
					(select jf2.* from (select jf1.*,
						rank() over (partition by jf1.form_id order by jf1.journal_date desc) as rnk
						from hrforms2_forms_journal_archive jf1
					) jf2
					where jf2.rnk = 1 and jf2.status ='Z'
					and jf2.group_to in (select group_id from hrforms2_user_groups where suny_id = :suny_id)) j
					left join (select form_id, max(journal_date) as max_journal_date, listagg(group_to,',') as journal_groups, listagg(status,',') within group (order by sequence) as journal_status from hrforms2_forms_journal_archive where sequence >= 0 group by form_id) js on (js.form_id = j.form_id)
					where f.form_id = j.form_id
					". $filter;
				$stmt = oci_parse($this->db,$qry);
				oci_bind_by_name($stmt,":suny_id",$this->sessionData['EFFECTIVE_SUNY_ID']);
				if ($_GET['formId'] != "") oci_bind_by_name($stmt,":form_id",$_GET['formId']);
				if ($_GET['startDate'] != "") oci_bind_by_name($stmt,":start_date",$_GET['startDate']);
				if ($_GET['endDate'] != "") oci_bind_by_name($stmt,":end_date",$_GET['endDate']);
				if ($_GET['personName'] != "") oci_bind_by_name($stmt,":person_name",$personName);
				if ($_GET['payroll'] != "") oci_bind_by_name($stmt,":payroll",$_GET['payroll']);
				if ($_GET['formCode'] != "") oci_bind_by_name($stmt,":formCode",$_GET['formCode']);
				if ($_GET['actionCode'] != "") oci_bind_by_name($stmt,":actionCode",$_GET['actionCode']);
				if ($_GET['transactionCode'] != "") oci_bind_by_name($stmt,":transactionCode",$_GET['transactionCode']);
				if ($_GET['lineNumber'] != "") oci_bind_by_name($stmt,":line_number",$_GET['lineNumber']);
				if ($_GET['benefitFlag'] != "") oci_bind_by_name($stmt,":benefits_flag",$_GET['benefitFlag']);
				if ($_GET['createdBy'] != "") oci_bind_by_name($stmt,":created_by",$_GET['createdBy']);
				$r = oci_execute($stmt);
				if (!$r) $this->raiseError();
				[$total] = oci_fetch_array($stmt,OCI_NUM);
				oci_free_statement($stmt);
	
				$qry = "select f.form_id, f.created_by.SUNY_ID as created_by_suny_id, 
					nvl(f.created_by.ALIAS_FIRST_NAME,f.created_by.LEGAL_FIRST_NAME) as created_by_first_name, 
					f.created_by.LEGAL_LAST_NAME as created_by_legal_last_name,
					to_char(f.created_date,'DD-MON-YYYY HH24:MI:SS') as created_date, 
					f.form_data.effDate,
					nvl(f.form_data.person.information.ALIAS_FIRST_NAME,f.form_data.person.information.LEGAL_FIRST_NAME) as FIRST_NAME,
					f.form_data.person.information.LEGAL_MIDDLE_NAME as LEGAL_MIDDLE_NAME,
					f.form_data.person.information.LEGAL_LAST_NAME as LEGAL_LAST_NAME,
					f.form_data.formActions.formCode.FORM_CODE as FORM_CODE,
					f.form_data.formActions.formCode.FORM_TITLE as FORM_TITLE,
					f.form_data.formActions.actionCode.ACTION_CODE as ACTION_CODE,
					f.form_data.formActions.actionCodeTitle.ACTION_TITLE as ACTION_TITLE,
					f.form_data.formActions.transactionCode.TRANSACTION_CODE as TRANSACTION_CODE,
					f.form_data.formActions.transactionCode.TRANSACTION_TITLE as TRANSACTION_TITLE,
					f.form_data.payroll.PAYROLL_CODE as PAYROLL_CODE,
					f.form_data.payroll.PAYROLL_TITLE as PAYROLL_TITLE,
					f.form_data.payroll.PAYROLL_DESCRIPTION as PAYROLL_DESCRIPTION,
					f.form_data.employment.position.positionDetails.LINE_NUMBER as LINE_NUMBER,
					f.form_data.employment.position.BENEFIT_FLAG as BENEFIT_FLAG,
					f.form_data.employment.position.positionDetails.TITLE as TITLE,
					j.status, j.sequence, js.journal_groups as groups, js.journal_status,
					to_char(js.max_journal_date,'DD-MON-YYYY HH24:MI:SS') as max_journal_date
					from hrforms2_forms_archive f,
					(select jf2.* from (select jf1.*,
						rank() over (partition by jf1.form_id order by jf1.journal_date desc) as rnk
						from hrforms2_forms_journal_archive jf1
					) jf2
					where jf2.rnk = 1 and jf2.status ='Z'
					and jf2.group_to in (select group_id from hrforms2_user_groups where suny_id = :suny_id)) j
					left join (select form_id, max(journal_date) as max_journal_date, listagg(group_to,',') as journal_groups, listagg(status,',') within group (order by sequence) as journal_status from hrforms2_forms_journal_archive where sequence >= 0 group by form_id) js on (js.form_id = j.form_id)
					where f.form_id = j.form_id
					". $filter. "
					" . $sort . "
					offset :offset rows
					fetch next :results rows only";
					$stmt = oci_parse($this->db,$qry);
					oci_bind_by_name($stmt,":suny_id",$this->sessionData['EFFECTIVE_SUNY_ID']);
					if ($_GET['formId'] != "") oci_bind_by_name($stmt,":form_id",$_GET['formId']);
					if ($_GET['startDate'] != "") oci_bind_by_name($stmt,":start_date",$_GET['startDate']);
					if ($_GET['endDate'] != "") oci_bind_by_name($stmt,":end_date",$_GET['endDate']);
					if ($_GET['personName'] != "") oci_bind_by_name($stmt,":person_name",$personName);
					if ($_GET['payroll'] != "") oci_bind_by_name($stmt,":payroll",$_GET['payroll']);
					if ($_GET['formCode'] != "") oci_bind_by_name($stmt,":formCode",$_GET['formCode']);					
					if ($_GET['actionCode'] != "") oci_bind_by_name($stmt,":actionCode",$_GET['actionCode']);
					if ($_GET['transactionCode'] != "") oci_bind_by_name($stmt,":transactionCode",$_GET['transactionCode']);
					if ($_GET['lineNumber'] != "") oci_bind_by_name($stmt,":line_number",$_GET['lineNumber']);
					if ($_GET['benefitFlag'] != "") oci_bind_by_name($stmt,":benefits_flag",$_GET['benefitFlag']);
					if ($_GET['createdBy'] != "") oci_bind_by_name($stmt,":created_by",$_GET['createdBy']);
					oci_bind_by_name($stmt,":offset",$offset);
					oci_bind_by_name($stmt,":results",$results);
					oci_execute($stmt);
					while ($row = oci_fetch_array($stmt,OCI_ASSOC+OCI_RETURN_NULLS)) {
						$row['BENEFIT_FLAG'] = json_decode($row['BENEFIT_FLAG']);
						$row['STATUS_ARRAY'] = explode(",",$row['JOURNAL_STATUS']);
						$this->_arr[] = $row;
					}
				break;

			/* BAD REQUEST - Should not get here */
			default:
				$this->raiseError(E_BAD_REQUEST);
		}

		$this->returnData = array(
			"results" => $this->null2Empty($this->_arr),
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
		// set defaults
		$page = 1;
		$results = 10;
		$offset = ($results=='all')?0:($page-1)*$results;

		switch($this->k['id']) {
			case "request_id":
				$filter = "";
				if ($this->POSTvars['reqId'] != "") $filter .= " and r.request_id = :request_id";
				if ($this->POSTvars['startDate']) $filter .= " and trunc(r.effective_date) >= :start_date";
				if ($this->POSTvars['endDate']) $filter .= " and trunc(r.effective_date) <= :end_date";
				if ($this->POSTvars['posType'] != "") $filter .= " and r.request_data.posType.id = :posType";
				if ($this->POSTvars['reqType'] != "") $filter .= " and r.request_data.reqType.id = :reqType";
				if ($this->POSTvars['candidateName'] != "") $filter .= " and lower(r.request_data.candidateName) like lower('%'||:candidateName||'%')";
				if ($this->POSTvars['lineNumber'] != "") $filter .= " and r.request_data.lineNumber = :lineNumber";

				// get total count of records
				$qry = "select count(r.request_id)
					from hrforms2_requests_archive r,
					(select jr2.* from (select jr1.*,
						rank() over (partition by jr1.request_id order by jr1.journal_date desc) as rnk
						from hrforms2_requests_journal_archive jr1
					) jr2
					where jr2.rnk = 1 and jr2.status ='Z'
					and jr2.group_to in (select group_id from hrforms2_user_groups where suny_id = :suny_id)) j
					left join (select request_id, max(journal_date) as max_journal_date, listagg(group_to,',') as journal_groups, listagg(status,',') within group (order by sequence) as journal_status from hrforms2_requests_journal_archive where sequence >= 0 group by request_id) js on (js.request_id = j.request_id)
					where r.request_id = j.request_id
					". $filter;
				$stmt = oci_parse($this->db,$qry);
				oci_bind_by_name($stmt,":suny_id",$this->sessionData['EFFECTIVE_SUNY_ID']);
				if ($this->POSTvars['reqId'] != "") oci_bind_by_name($stmt,":request_id",$this->POSTvars['reqId']);
				if ($this->POSTvars['startDate'] != "") oci_bind_by_name($stmt,":start_date",$this->POSTvars['startDate']);
				if ($this->POSTvars['endDate'] != "") oci_bind_by_name($stmt,":end_date",$this->POSTvars['endDate']);
				if ($this->POSTvars['posType'] != "") oci_bind_by_name($stmt,":posType",$this->POSTvars['posType']);
				if ($this->POSTvars['reqType'] != "") oci_bind_by_name($stmt,":reqType",$this->POSTvars['reqType']);
				if ($this->POSTvars['candidateName'] != "") oci_bind_by_name($stmt,":candidateName",$this->POSTvars['candidateName']);
				if ($this->POSTvars['lineNumber'] != "") oci_bind_by_name($stmt,":lineNumber",$this->POSTvars['lineNumber']);
				$r = oci_execute($stmt);
				if (!$r) $this->raiseError();
				[$total] = oci_fetch_array($stmt,OCI_NUM);
				oci_free_statement($stmt);

				// get data using offset and fetch/limit
				$qry = "select r.request_id, r.created_by.SUNY_ID as created_by_suny_id,
					to_char(r.created_date,'DD-MON-YYYY HH24:MI:SS') as created_date, 
					r.request_data.posType, r.request_data.reqType, r.request_data.effDate, 
					r.request_data.candidateName, r.request_data.lineNumber, r.request_data.reqBudgetTitle.title,
					r.created_by.LEGAL_FIRST_NAME, r.created_by.LEGAL_LAST_NAME, r.created_by.ALIAS_FIRST_NAME,
					j.status, j.sequence, js.journal_groups as groups, js.journal_status,
					to_char(js.max_journal_date,'DD-MON-YYYY HH24:MI:SS') as max_journal_date
					from hrforms2_requests_archive r,
					(select jr2.* from (select jr1.*,
						rank() over (partition by jr1.request_id order by jr1.journal_date desc) as rnk
						from hrforms2_requests_journal_archive jr1
					) jr2
					where jr2.rnk = 1 and jr2.status ='Z'
					and jr2.group_to in (select group_id from hrforms2_user_groups where suny_id = :suny_id)) j
					left join (select request_id, max(journal_date) as max_journal_date, listagg(group_to,',') as journal_groups, listagg(status,',') within group (order by sequence) as journal_status from hrforms2_requests_journal_archive where sequence >= 0 group by request_id) js on (js.request_id = j.request_id)
					where r.request_id = j.request_id
					". $filter. "
					offset :offset rows
					fetch next :results rows only";
				$stmt = oci_parse($this->db,$qry);
				oci_bind_by_name($stmt,":suny_id",$this->sessionData['EFFECTIVE_SUNY_ID']);
				if ($this->POSTvars['reqId'] != "") oci_bind_by_name($stmt,":request_id",$this->POSTvars['reqId']);
				if ($this->POSTvars['startDate'] != "") oci_bind_by_name($stmt,":start_date",$this->POSTvars['startDate']);
				if ($this->POSTvars['endDate'] != "") oci_bind_by_name($stmt,":end_date",$this->POSTvars['endDate']);
				if ($this->POSTvars['posType'] != "") oci_bind_by_name($stmt,":posType",$this->POSTvars['posType']);
				if ($this->POSTvars['reqType'] != "") oci_bind_by_name($stmt,":reqType",$this->POSTvars['reqType']);
				if ($this->POSTvars['candidateName'] != "") oci_bind_by_name($stmt,":candidateName",$this->POSTvars['candidateName']);
				if ($this->POSTvars['lineNumber'] != "") oci_bind_by_name($stmt,":lineNumber",$this->POSTvars['lineNumber']);
				oci_bind_by_name($stmt,":offset",$offset);
				oci_bind_by_name($stmt,":results",$results);
				oci_execute($stmt);
				while ($row = oci_fetch_array($stmt,OCI_ASSOC+OCI_RETURN_NULLS)) {
					$row['POSTYPE'] = json_decode($row['POSTYPE']);
					$row['REQTYPE'] = json_decode($row['REQTYPE']);
					$row['STATUS_ARRAY'] = explode(",",$row['JOURNAL_STATUS']);
					$this->_arr[] = $row;
				}
				break;

			/* FORM ARCHIVES */
			case "form_id":
				$filter = "";
				if ($this->POSTvars['startDate']) $filter .= " and trunc(to_timestamp(f.form_data.effDate,'YYYY-MM-DD\"T\"HH24:MI:SS.FF3\"Z\"')) >= :start_date";
				if ($this->POSTvars['endDate']) $filter .= " and trunc(to_timestamp(f.form_data.effDate,'YYYY-MM-DD\"T\"HH24:MI:SS.FF3\"Z\"')) <= :end_date";
				if ($this->POSTvars['formId'] != "") $filter .= " and f.form_id = :form_id";
				if ($this->POSTvars['personName'] != "") {
					$personName = strtolower($this->POSTvars['personName']);
					$filter .= " and (lower(nvl(f.form_data.person.information.ALIAS_FIRST_NAME,f.form_data.person.information.LEGAL_FIRST_NAME)) like '%'||:person_name||'%' or lower(f.form_data.person.information.LEGAL_LAST_NAME) like '%'||:person_name||'%')";
				}
				if ($this->POSTvars['payroll'] != "") $filter .= " and f.form_data.payroll.PAYROLL_CODE = :payroll";
				if ($this->POSTvars['lineNumber'] != "") $filter .= " and f.form_data.employment.position.positionDetails.LINE_NUMBER = :line_number";
				if ($this->POSTvars['benefitFlag'] != "") $filter .= " and f.form_data.employment.position.BENEFIT_FLAG.id = :benefits_flag";

				$qry = "select count(f.form_id)
					from hrforms2_forms_archive f,
					(select jf2.* from (select jf1.*,
						rank() over (partition by jf1.form_id order by jf1.journal_date desc) as rnk
						from hrforms2_forms_journal_archive jf1
					) jf2
					where jf2.rnk = 1 and jf2.status ='Z'
					and jf2.group_to in (select group_id from hrforms2_user_groups where suny_id = :suny_id)) j
					left join (select form_id, max(journal_date) as max_journal_date, listagg(group_to,',') as journal_groups, listagg(status,',') within group (order by sequence) as journal_status from hrforms2_forms_journal_archive where sequence >= 0 group by form_id) js on (js.form_id = j.form_id)
					where f.form_id = j.form_id
					". $filter;
				$stmt = oci_parse($this->db,$qry);
				oci_bind_by_name($stmt,":suny_id",$this->sessionData['EFFECTIVE_SUNY_ID']);
				if ($this->POSTvars['formId'] != "") oci_bind_by_name($stmt,":form_id",$this->POSTvars['formId']);
				if ($this->POSTvars['startDate'] != "") oci_bind_by_name($stmt,":start_date",$this->POSTvars['startDate']);
				if ($this->POSTvars['endDate'] != "") oci_bind_by_name($stmt,":end_date",$this->POSTvars['endDate']);
				if ($this->POSTvars['personName'] != "") oci_bind_by_name($stmt,":person_name",$personName);
				if ($this->POSTvars['payroll'] != "") oci_bind_by_name($stmt,":payroll",$this->POSTvars['payroll']);
				if ($this->POSTvars['lineNumber'] != "") oci_bind_by_name($stmt,":line_number",$this->POSTvars['lineNumber']);
				if ($this->POSTvars['benefitFlag'] != "") oci_bind_by_name($stmt,":benefits_flag",$this->POSTvars['benefitFlag']);
				$r = oci_execute($stmt);
				if (!$r) $this->raiseError();
				[$total] = oci_fetch_array($stmt,OCI_NUM);
				oci_free_statement($stmt);
	
				$qry = "select f.form_id, f.created_by.SUNY_ID as created_by_suny_id, 
					nvl(f.created_by.ALIAS_FIRST_NAME,f.created_by.LEGAL_FIRST_NAME) as created_by_first_name, 
					f.created_by.LEGAL_LAST_NAME as created_by_legal_last_name,
					to_char(f.created_date,'DD-MON-YYYY HH24:MI:SS') as created_date, 
					f.form_data.effDate,
					nvl(f.form_data.person.information.ALIAS_FIRST_NAME,f.form_data.person.information.LEGAL_FIRST_NAME) as FIRST_NAME,
					f.form_data.person.information.LEGAL_MIDDLE_NAME as LEGAL_MIDDLE_NAME,
					f.form_data.person.information.LEGAL_LAST_NAME as LEGAL_LAST_NAME,
					f.form_data.formActions.formCode.FORM_CODE as FORM_CODE,
					f.form_data.formActions.formCode.FORM_TITLE as FORM_TITLE,
					f.form_data.formActions.actionCode.ACTION_CODE as ACTION_CODE,
					f.form_data.formActions.actionCodeTitle.ACTION_TITLE as ACTION_TITLE,
					f.form_data.formActions.transactionCode.TRANSACTION_CODE as TRANSACTION_CODE,
					f.form_data.formActions.transactionCode.TRANSACTION_TITLE as TRANSACTION_TITLE,
					f.form_data.payroll.PAYROLL_CODE as PAYROLL_CODE,
					f.form_data.payroll.PAYROLL_TITLE as PAYROLL_TITLE,
					f.form_data.payroll.PAYROLL_DESCRIPTION as PAYROLL_DESCRIPTION,
					f.form_data.employment.position.positionDetails.LINE_NUMBER as LINE_NUMBER,
					f.form_data.employment.position.BENEFIT_FLAG as BENEFIT_FLAG,
					f.form_data.employment.position.positionDetails.TITLE as TITLE,
					j.status, j.sequence, js.journal_groups as groups, js.journal_status,
					to_char(js.max_journal_date,'DD-MON-YYYY HH24:MI:SS') as max_journal_date
					from hrforms2_forms_archive f,
					(select jf2.* from (select jf1.*,
						rank() over (partition by jf1.form_id order by jf1.journal_date desc) as rnk
						from hrforms2_forms_journal_archive jf1
					) jf2
					where jf2.rnk = 1 and jf2.status ='Z'
					and jf2.group_to in (select group_id from hrforms2_user_groups where suny_id = :suny_id)) j
					left join (select form_id, max(journal_date) as max_journal_date, listagg(group_to,',') as journal_groups, listagg(status,',') within group (order by sequence) as journal_status from hrforms2_forms_journal_archive where sequence >= 0 group by form_id) js on (js.form_id = j.form_id)
					where f.form_id = j.form_id
					". $filter. "
					offset :offset rows
					fetch next :results rows only";
					$stmt = oci_parse($this->db,$qry);
					oci_bind_by_name($stmt,":suny_id",$this->sessionData['EFFECTIVE_SUNY_ID']);
					if ($this->POSTvars['formId'] != "") oci_bind_by_name($stmt,":form_id",$this->POSTvars['formId']);
					if ($this->POSTvars['startDate'] != "") oci_bind_by_name($stmt,":start_date",$this->POSTvars['startDate']);
					if ($this->POSTvars['endDate'] != "") oci_bind_by_name($stmt,":end_date",$this->POSTvars['endDate']);
					if ($this->POSTvars['personName'] != "") oci_bind_by_name($stmt,":person_name",$personName);
					if ($this->POSTvars['payroll'] != "") oci_bind_by_name($stmt,":payroll",$this->POSTvars['payroll']);
					if ($this->POSTvars['lineNumber'] != "") oci_bind_by_name($stmt,":line_number",$this->POSTvars['lineNumber']);
					if ($this->POSTvars['benefitFlag'] != "") oci_bind_by_name($stmt,":benefits_flag",$this->POSTvars['benefitFlag']);
					oci_bind_by_name($stmt,":offset",$offset);
					oci_bind_by_name($stmt,":results",$results);
					oci_execute($stmt);
					while ($row = oci_fetch_array($stmt,OCI_ASSOC+OCI_RETURN_NULLS)) {
						$row['BENEFIT_FLAG'] = json_decode($row['BENEFIT_FLAG']);
						$row['STATUS_ARRAY'] = explode(",",$row['JOURNAL_STATUS']);
						$this->_arr[] = $row;
					}
				break;

			/* BAD REQUEST - Should not get here */
			default:
				$this->raiseError(E_BAD_REQUEST);
		}

		$this->returnData = array(
			"results" => $this->null2Empty($this->_arr),
			"info" => array(
				"page" => $page,
				"results" => $results,
				"offset" => $offset,
				"total_rows" => $total
			)
		);
		if ($this->retJSON) $this->toJSON($this->returnData);
	}
}
