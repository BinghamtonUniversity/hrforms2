<?php
/*
NB: set $this->reqAuth = false in __construct to allow calls to functions without authentication checks.  Call $this->checkAuth() from functions to selectively restrict access.

NB: HTTP Codes: https://tools.ietf.org/html/rfc7231#section-6
405: Method Not Allowed
501: Not Implemented

NB: HTTP Request Methods: https://tools.ietf.org/html/rfc7231#section-4.3
*/

class Counts extends HRForms2 {
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
		$counts = array();

		/* Requests */
		$qry = "with counts as (select 'drafts' as menu, count(suny_id) as count, 0 as age
			from hrforms2_requests_drafts
			where suny_id = :suny_id
			union
			select 'pending', count(j.request_id), trunc(sysdate) - trunc(min(j.last_journal_date))
			from hrforms2_requests_journal_last j
			join (select * from hrforms2_requests) r on (j.request_id = r.request_id)
			where last_status in ('PA','PF')
			and r.created_by.SUNY_ID = :suny_id
			union
			select 'approvals', count(j.request_id), trunc(sysdate) - trunc(min(j.last_journal_date))
			from hrforms2_requests_journal_last j
			join (select * from hrforms2_requests) r on (j.request_id = r.request_id)
			where last_status = 'PA'
			and last_group_to in (select group_id from hrforms2_user_groups where suny_id = :suny_id)
			and r.created_by.SUNY_ID != :suny_id
			union
			select 'rejections', count(j.request_id), trunc(sysdate) - trunc(min(j.last_journal_date))
			from hrforms2_requests_journal_last j
			join (select * from hrforms2_requests) r on (j.request_id = r.request_id)
			where last_status = 'R'
			and r.created_by.SUNY_ID = :suny_id
			union
			select 'final', count(j.request_id), trunc(sysdate) - trunc(min(j.last_journal_date))
			from hrforms2_requests_journal_last j
			join (select * from hrforms2_requests) r on (j.request_id = r.request_id)
			where last_status = 'PF'
			and last_group_to in (select group_id from hrforms2_user_groups where suny_id = :suny_id)
			and r.created_by.SUNY_ID != :suny_id)
		select json_objectagg(key menu value json_object(
			key 'count' is counts.count,
			key 'age' is nvl(counts.age,0))) as json
		from counts";
		$stmt = oci_parse($this->db,$qry);
		oci_bind_by_name($stmt,":suny_id",$this->sessionData['EFFECTIVE_SUNY_ID']);
		oci_execute($stmt);
		$row = oci_fetch_array($stmt,OCI_ASSOC+OCI_RETURN_NULLS);
		$counts['requests'] = json_decode($row['JSON']);
	
		/* Forms */
		$qry = "with counts as (select 'drafts' as menu, count(suny_id) as count, 0 as age
			from hrforms2_forms_drafts
			where suny_id = :suny_id
			union
			select 'approvals', count(j.form_id), trunc(sysdate) - trunc(min(j.last_journal_date))
			from hrforms2_forms_journal_last j
			join (select * from hrforms2_forms) f on (j.form_id = f.form_id)
			where last_status = 'PA'
			and last_group_to in (select group_id from hrforms2_user_groups where suny_id = :suny_id)
			and f.created_by.SUNY_ID != :suny_id
			union
			select 'final', count(j.form_id), trunc(sysdate) - trunc(min(j.last_journal_date))
			from hrforms2_forms_journal_last j
			join (select * from hrforms2_forms) f on (j.form_id = f.form_id)
			where last_status = 'PF'
			and last_group_to in (select group_id from hrforms2_user_groups where suny_id = :suny_id)
			and f.created_by.SUNY_ID != :suny_id
			union
			select 'pending', count(j.form_id), trunc(sysdate) - trunc(min(j.last_journal_date))
			from hrforms2_forms_journal_last j
			join (select * from hrforms2_forms) f on (j.form_id = f.form_id)
			where last_status in ('PA','PF')
			and f.created_by.SUNY_ID = :suny_id
			union
			select 'rejections', count(j.form_id), trunc(sysdate) - trunc(min(j.last_journal_date))
			from hrforms2_forms_journal_last j
			join (select * from hrforms2_forms) f on (j.form_id = f.form_id)
			where last_status = 'R'
			and f.created_by.SUNY_ID = :suny_id)
		select json_objectagg(key menu value json_object(
			key 'count' is counts.count,
			key 'age' is nvl(counts.age,0))) as json
		from counts";
		$stmt = oci_parse($this->db,$qry);
		oci_bind_by_name($stmt,":suny_id",$this->sessionData['EFFECTIVE_SUNY_ID']);
		oci_execute($stmt);
		$row = oci_fetch_array($stmt,OCI_ASSOC+OCI_RETURN_NULLS);
		$counts['forms'] = json_decode($row['JSON']);

		$this->returnData = $counts;
		if ($this->retJSON) $this->toJSON($this->returnData);
	}
}
