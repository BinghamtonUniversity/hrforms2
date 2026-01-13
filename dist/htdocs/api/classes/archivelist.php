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
        //server cannot use null coalescing operator.  TODO: Change this
        #$page = $_GET['page'] ?? 1;
        #$results = $_GET['results'] ?? 10;
        $page = isset($_GET['page']) ? $_GET['page'] : 1;
        $results = isset($_GET['results']) ? $_GET['results'] : 10;
        $offset = ($page-1)*$results;

        switch($this->k['id']) {
            /* REQUESTS */
            case "request_id":
                $_GET = array_merge(array(
                    "reqId"=>"",
                    "startDate"=>"",
                    "endDate"=>"",
                    "posType"=>"",
                    "reqType"=>"",
                    "candidateName"=>"",
                    "lineNumber"=>"",
                    "multiLines"=>"N",
                    "title"=>"",
                    "createdBy"=>"",
                    "updatedBy"=>"",
                    "sortField"=>"request_id",
                    "sortDir"=>"desc"
                ),$_GET);
                $filter = "";
                if ($_GET['reqId'] != "") $filter .= " and r.request_id = :request_id";
                if ($_GET['reqId'] == "") {
                    if ($_GET['startDate']) $filter .= " and trunc(to_timestamp(r.request_data.effDate,'YYYY-MM-DD\"T\"HH24:MI:SS.FF3\"Z\"')) >= :start_date";
                    if ($_GET['endDate']) $filter .= " and trunc(to_timestamp(r.request_data.effDate,'YYYY-MM-DD\"T\"HH24:MI:SS.FF3\"Z\"')) <= :end_date";
                    if ($_GET['posType'] != "") $filter .= " and r.request_data.posType.id = :posType";
                    if ($_GET['reqType'] != "") $filter .= " and r.request_data.reqType.id = :reqType";
                    if ($_GET['candidateName'] != "") $filter .= " and lower(r.request_data.candidateName) like lower('%'||:candidateName||'%')";
                    if ($_GET['lineNumber'] != "") $filter .= " and r.request_data.lineNumber = :lineNumber";
                    if ($_GET['multiLines'] == "Y") $filter .= " and r.request_data.multiLines = 'Y'";
                    if ($_GET['title'] != "") $filter .= " and lower(r.request_data.reqBudgetTitle.title) like lower('%'||:title||'%')";
                    if ($_GET['createdBy'] != "") $filter .= " and r.created_by.SUNY_ID = :created_by";
                    if ($_GET['updatedBy'] != "") $filter .= " and j.suny_id = :updated_by";
                }
                $sort = "";
                switch($_GET['sortField']) {
                    case "candidate_name":
                        $sort = "order by LEGAL_LAST_NAME || ',' || FIRST_NAME " . $_GET['sortDir'] . ", effdate desc";
                        break;
                    case "created_by":
                        $sort = "order by r.created_by.LEGAL_LAST_NAME || ',' || r.created_by.ALIAS_FIRST_NAME || ',' || r.created_by.LEGAL_FIRST_NAME " . $_GET['sortDir'] . ", effdate desc";
                        break;
                    case "last_updated_by":
                        $sort = "order by trim(u.last_update_last_name || ',' || u.last_update_first_name)" . $_GET['sortDir'] . ", effdate desc";
                        break;                    
                    default:
                        $sort = "order by " . $_GET['sortField'] . " " . $_GET['sortDir'];
                }
                // get total count of records
                $qry = "select count(r.request_id)
                    from hrforms2_requests_archive r,
                    (select jr2.* from (select jr1.*,
                        rank() over (partition by jr1.request_id order by jr1.journal_date desc) as rnk
                        from hrforms2_requests_journal_archive jr1
                    ) jr2
                    where jr2.sequence >= 0 and jr2.rnk = 1) j
                    left join (select request_id, max(journal_date) as max_journal_date, listagg(group_to,',') as journal_groups, listagg(status,',') within group (order by sequence) as journal_status from hrforms2_requests_journal_archive where sequence >= 0 group by request_id) js on (js.request_id = j.request_id)
                    where r.request_id = j.request_id
                    and exists (select 1
                        from hrforms2_requests_journal_archive
                        where (
                            suny_id = :suny_id or
                            group_to in (select group_id from hrforms2_user_groups where suny_id = :suny_id)
                        )
                        and request_id = j.request_id
                    )
                    ". $filter;
                $stmt = oci_parse($this->db,$qry);
                oci_bind_by_name($stmt,":suny_id",$this->sessionData['EFFECTIVE_SUNY_ID']);
                if ($_GET['reqId'] != "") oci_bind_by_name($stmt,":request_id",$_GET['reqId']);
                if ($_GET['reqId'] == "") {
                    if ($_GET['startDate'] != "") oci_bind_by_name($stmt,":start_date",$_GET['startDate']);
                    if ($_GET['endDate'] != "") oci_bind_by_name($stmt,":end_date",$_GET['endDate']);
                    if ($_GET['posType'] != "") oci_bind_by_name($stmt,":posType",$_GET['posType']);
                    if ($_GET['reqType'] != "") oci_bind_by_name($stmt,":reqType",$_GET['reqType']);
                    if ($_GET['candidateName'] != "") oci_bind_by_name($stmt,":candidateName",$_GET['candidateName']);
                    if ($_GET['lineNumber'] != "") oci_bind_by_name($stmt,":lineNumber",$_GET['lineNumber']);
                    if ($_GET['title'] != "") oci_bind_by_name($stmt,":title",$_GET['title']);
                    if ($_GET['createdBy'] != "") oci_bind_by_name($stmt,":created_by",$_GET['createdBy']);
                    if ($_GET['updatedBy'] != "") oci_bind_by_name($stmt,":updated_by",$_GET['updatedBy']);
                }
                $r = oci_execute($stmt);
                if (!$r) $this->raiseError();
                // Server cannot use destructuring assignment.  TODO: Change this
                //[$total] = oci_fetch_array($stmt,OCI_NUM);
                $row = oci_fetch_array($stmt,OCI_NUM);
                $total = $row[0];
                oci_free_statement($stmt);

                // get data using offset and fetch/limit
                $qry = "select r.request_id, r.created_by.SUNY_ID as created_by_suny_id,
                    r.request_data.posType, r.request_data.reqType, r.request_data.effDate, 
                    r.request_data.candidateName, r.request_data.multiLines, r.request_data.lineNumber, 
                    r.request_data.reqBudgetTitle.title, 
                    nvl(r.created_by.ALIAS_FIRST_NAME,r.created_by.LEGAL_FIRST_NAME) as created_by_first_name, 
                    r.created_by.LEGAL_LAST_NAME as created_by_legal_last_name, 
                    to_char(r.created_date,'DD-MON-YYYY HH24:MI:SS') as created_date, 
                    r.request_data.WORKFLOW_ID,
                    j.status, j.sequence, j.suny_id as last_updated_suny_id, 
                    trim(u.last_update_first_name || ' ' || u.last_update_last_name) as last_updated_name,
                    js.journal_groups as groups, js.journal_status,
                    to_char(js.max_journal_date,'DD-MON-YYYY HH24:MI:SS') as max_journal_date
                    from hrforms2_requests_archive r,
                    (select jr2.* from (select jr1.*,
                        rank() over (partition by jr1.request_id order by jr1.journal_date desc) as rnk
                        from hrforms2_requests_journal_archive jr1
                    ) jr2
                    where jr2.sequence >= 0 and jr2.rnk = 1) j
                    left join (select request_id, max(journal_date) as max_journal_date, listagg(group_to,',') as journal_groups, listagg(status,',') within group (order by sequence) as journal_status from hrforms2_requests_journal_archive where sequence >= 0 group by request_id) js on (js.request_id = j.request_id)
                    left join (select u1.suny_id, nvl(u1.user_info.ALIAS_FIRST_NAME,u1.user_info.LEGAL_FIRST_NAME) as last_update_first_name, u1.user_info.LEGAL_LAST_NAME as last_update_last_name from hrforms2_users u1) u on (u.suny_id = j.suny_id) 
                    where r.request_id = j.request_id
                    and exists (select 1
                        from hrforms2_requests_journal_archive
                        where (
                            suny_id = :suny_id or
                            group_to in (select group_id from hrforms2_user_groups where suny_id = :suny_id)
                        )   
                        and request_id = j.request_id
                    )
                    ". $filter. "
                    " . $sort . "
                    offset :offset rows
                    fetch next :results rows only";

                $stmt = oci_parse($this->db,$qry);
                oci_bind_by_name($stmt,":suny_id",$this->sessionData['EFFECTIVE_SUNY_ID']);
                if ($_GET['reqId'] != "") oci_bind_by_name($stmt,":request_id",$_GET['reqId']);
                if ($_GET['reqId'] == "") {
                    if ($_GET['startDate'] != "") oci_bind_by_name($stmt,":start_date",$_GET['startDate']);
                    if ($_GET['endDate'] != "") oci_bind_by_name($stmt,":end_date",$_GET['endDate']);
                    if ($_GET['posType'] != "") oci_bind_by_name($stmt,":posType",$_GET['posType']);
                    if ($_GET['reqType'] != "") oci_bind_by_name($stmt,":reqType",$_GET['reqType']);
                    if ($_GET['candidateName'] != "") oci_bind_by_name($stmt,":candidateName",$_GET['candidateName']);
                    if ($_GET['lineNumber'] != "") oci_bind_by_name($stmt,":lineNumber",$_GET['lineNumber']);
                    if ($_GET['title'] != "") oci_bind_by_name($stmt,":title",$_GET['title']);
                    if ($_GET['createdBy'] != "") oci_bind_by_name($stmt,":created_by",$_GET['createdBy']);
                    if ($_GET['updatedBy'] != "") oci_bind_by_name($stmt,":updated_by",$_GET['updatedBy']);
                }
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

            /* FORMS */
            case "form_id":
                $_GET = array_merge(array(
                    "formId"=>"",
                    "startDate"=>"",
                    "endDate"=>"",
                    "personName"=>"",
                    "payroll"=>"",
                    "formCode"=>"",
                    "actionCode"=>"",
                    "transactionCode"=>"",
                    "lineNumber"=>"",
                    "benefitFlag"=>"",
                    "createdBy"=>"",
                    "updatedBy"=>"",
                    "sortField"=>"form_id",
                    "sortDir"=>"desc"
                ),$_GET);
                $filter = "";
                if ($_GET['formId'] != "") $filter .= " and f.form_id = :form_id";
                if ($_GET['formId'] == "") {
                    if ($_GET['startDate']) $filter .= " and trunc(to_timestamp(f.form_data.effDate,'YYYY-MM-DD\"T\"HH24:MI:SS.FF3\"Z\"')) >= :start_date";
                    if ($_GET['endDate']) $filter .= " and trunc(to_timestamp(f.form_data.effDate,'YYYY-MM-DD\"T\"HH24:MI:SS.FF3\"Z\"')) <= :end_date";
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
                    if ($_GET['updatedBy'] != "") $filter .= " and j.suny_id = :updated_by";
                }

                $sort = "";
                switch($_GET['sortField']) {
                    case "fullname":
                        $sort = "order by LEGAL_LAST_NAME || ',' || FIRST_NAME " . $_GET['sortDir'] . ", effdate desc";
                        break;
                    case "form_code":
                        $sort = "order by FORM_CODE || '-' || ACTION_CODE || '-' || TRANSACTION_CODE " . $_GET['sortDir'] . ", effdate desc";
                        break;
                    case "created_by":
                        $sort = "order by f.created_by.LEGAL_LAST_NAME || ',' || f.created_by.ALIAS_FIRST_NAME || ',' || f.created_by.LEGAL_FIRST_NAME " . $_GET['sortDir'] . ", effdate desc";
                        break;
                    case "last_updated_by":
                        $sort = "order by trim(u.last_update_last_name || ',' || u.last_update_first_name)" . $_GET['sortDir'] . ", effdate desc";
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
                    where jf2.sequence >= 0 and jf2.rnk = 1) j
                    left join (select form_id, max(journal_date) as max_journal_date, listagg(group_to,',') as journal_groups, listagg(status,',') within group (order by sequence) as journal_status from hrforms2_forms_journal_archive where sequence >= 0 group by form_id) js on (js.form_id = j.form_id)
                    where f.form_id = j.form_id
                    and exists (select 1
                        from hrforms2_forms_journal_archive
                        where (
                            suny_id = :suny_id or
                            group_to in (select group_id from hrforms2_user_groups where suny_id = :suny_id)
                        )   
                        and form_id = f.form_id
                    )
                    ". $filter;
                $stmt = oci_parse($this->db,$qry);
                oci_bind_by_name($stmt,":suny_id",$this->sessionData['EFFECTIVE_SUNY_ID']);
                if ($_GET['formId'] != "") oci_bind_by_name($stmt,":form_id",$_GET['formId']);
                if ($_GET['formId'] == "") {
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
                    if ($_GET['updatedBy'] != "") oci_bind_by_name($stmt,":updated_by",$_GET['updatedBy']);
                }
                $r = oci_execute($stmt);
                if (!$r) $this->raiseError();
                // Server cannot use destructuring assignment.  TODO: Change this
                //[$total] = oci_fetch_array($stmt,OCI_NUM);
                $row = oci_fetch_array($stmt,OCI_NUM);
                $total = $row[0];
                oci_free_statement($stmt);
    
                $qry = "select f.form_id, f.created_by.SUNY_ID as created_by_suny_id, 
                    nvl(f.created_by.ALIAS_FIRST_NAME,f.created_by.LEGAL_FIRST_NAME) as created_by_first_name, 
                    f.created_by.LEGAL_LAST_NAME as created_by_legal_last_name,
                    to_char(f.created_date,'DD-MON-YYYY HH24:MI:SS') as created_date, 
                    f.form_data.effDate, f.form_data.WORKFLOW_ID,
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
                    j.status, j.sequence, j.suny_id as last_updated_suny_id, 
                    trim(u.last_update_first_name || ' ' || u.last_update_last_name) as last_updated_name,
                    js.journal_groups as groups, js.journal_status,
                    to_char(js.max_journal_date,'DD-MON-YYYY HH24:MI:SS') as max_journal_date
                    from hrforms2_forms_archive f,
                    (select jf2.* from (select jf1.*,
                        rank() over (partition by jf1.form_id order by jf1.journal_date desc) as rnk
                        from hrforms2_forms_journal_archive jf1
                    ) jf2
                    where jf2.sequence >= 0 and jf2.rnk = 1) j
                    left join (select form_id, max(journal_date) as max_journal_date, listagg(group_to,',') as journal_groups, listagg(status,',') within group (order by sequence) as journal_status from hrforms2_forms_journal_archive where sequence >= 0 group by form_id) js on (js.form_id = j.form_id)
                    left join (select u1.suny_id, nvl(u1.user_info.ALIAS_FIRST_NAME,u1.user_info.LEGAL_FIRST_NAME) as last_update_first_name, u1.user_info.LEGAL_LAST_NAME as last_update_last_name from hrforms2_users u1) u on (u.suny_id = j.suny_id) 
                    where f.form_id = j.form_id
                    and exists (select 1
                        from hrforms2_forms_journal_archive
                        where (
                            suny_id = :suny_id or
                            group_to in (select group_id from hrforms2_user_groups where suny_id = :suny_id)
                        )   
                        and form_id = f.form_id
                    )
                    ". $filter. "
                    " . $sort . "
                    offset :offset rows
                    fetch next :results rows only";
                    $stmt = oci_parse($this->db,$qry);
                    oci_bind_by_name($stmt,":suny_id",$this->sessionData['EFFECTIVE_SUNY_ID']);
                    if ($_GET['formId'] != "") oci_bind_by_name($stmt,":form_id",$_GET['formId']);
                    if ($_GET['formId'] == "") {
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
                        if ($_GET['updatedBy'] != "") oci_bind_by_name($stmt,":updated_by",$_GET['updatedBy']);
                    }
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
