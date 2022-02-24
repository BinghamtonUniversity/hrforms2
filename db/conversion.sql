-- SQL to convert HRFORMS_PR_APPROVAL_HIERARCHY into HRFORMS2_REQUESTS_WORKFLOW:
insert into hrforms2_requests_workflow 
select hrforms2_requests_workflow_seq.nextval, groups from (
select distinct groups from (
select hierarchy_id, group_id, 
listagg(group_to,',') within group (order by seq_num) as groups
from hrforms_pr_approval_hierarchy
group by hierarchy_id,group_id));

-- SQL to create new records in HRFORMS2_REQUESTS_HIERARCHY using the workflows created in previous SQL:
insert into hrforms2_requests_hierarchy
select hrforms2_requests_hierarchy_seq.nextval, decode(h.hierarchy_id,1,'C',2,'F',3,'P'), 
h.group_id, w.workflow_id
from (select hierarchy_id, group_id, 
listagg(group_to,',') within group (order by seq_num) as groups
from hrforms_pr_approval_hierarchy
group by hierarchy_id,group_id) h,
hrforms2_requests_workflow w
where h.groups = w.groups;