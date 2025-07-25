import React, { useState, lazy, useEffect } from "react";
import { useParams, useHistory } from "react-router-dom";
import { useWorkflowQueries } from "../../../queries/hierarchy";
import useGroupQueries from "../../../queries/groups";
import { find, sortBy } from 'lodash';
import { Container, Row, Col, Tabs, Tab, Badge } from "react-bootstrap";
import { Loading, AppButton, DescriptionPopover } from "../../../blocks/components";
import { Icon } from "@iconify/react";
import { useHotkeys } from "react-hotkeys-hook";
import { t } from "../../../config/text";
import { NotFound } from "../../../app";
import { Helmet } from "react-helmet";

export const WorkflowContext = React.createContext();
WorkflowContext.displayName = 'WorkflowContext';

const AdminRequestHierarchyHierarchy = lazy(()=>import("../../../blocks/admin/hierarchy/requests/hierarchy"));
const AdminRequestHierarchyWorkflow = lazy(()=>import("../../../blocks/admin/hierarchy/requests/workflow"));

export default function AdminRequestHierarchy() {
    const tabs = [
        {id:'hierarchy',title:t('admin.hierarchy.request.tabs.hierarchy')},
        {id:'workflow',title:t('admin.hierarchy.request.tabs.workflow')}
    ];
    const {pagetab} = useParams();
    const history = useHistory();
    const [activeTab,setActiveTab] = useState('hierarchy');
    const [isNew,setIsNew] = useState('');
    const [hierarchyFilterText,setHierarchyFilterText] = useState('');
    const [workflowFilterText,setWorkflowFilterText] = useState('');

    useHotkeys('ctrl+alt+n',()=>{
        setIsNew(activeTab);
    },{enableOnTags:['INPUT']},[activeTab]);
    useHotkeys('ctrl+right,ctrl+left',(_,handler)=>{
        const tabIds = tabs.map(t=>t.id);
        const idx = tabIds.indexOf(activeTab);
        let newIdx = (handler.key=='ctrl+left')?idx-1:idx+1;
        if (newIdx>=tabIds.length) newIdx = 0;
        setActiveTab(tabIds.at(newIdx));
    },{enableOnTags:['INPUT']},[activeTab]);

    const {getGroups} = useGroupQueries();
    const {getWorkflow} = useWorkflowQueries('request');
    const groups = getGroups({select:d=>sortBy(d,['GROUP_NAME'])});
    const workflows = getWorkflow({enabled:!!groups.data,select:d=>{
        return d.map(w => {
            w.GROUPS_ARRAY = w.GROUPS.split(',').map(g => {
                const name = find(groups.data,{GROUP_ID:g})
                return {GROUP_ID:g,GROUP_NAME:name?.GROUP_NAME}
            });
            return w;
        });
    }});

    const navigate = tab => {
        setActiveTab(tab);
        history.push('/admin/hierarchy/request/'+tab);
    }

    useEffect(()=>{setActiveTab(tabs.map(t=>t.id).includes(pagetab)?pagetab:'hierarchy');},[pagetab]);
    if (groups.isError||workflows.isError) return <Loading isError>Error Loading Data</Loading>;
    if (groups.isLoading||workflows.isIdle||workflows.isLoading) return <Loading type="alert">Loading Data</Loading>;
    return (
        <WorkflowContext.Provider value={{
            groups:groups.data,
            workflows:workflows.data,
            isNew:isNew,
            setIsNew:setIsNew,
            activeTab:activeTab,
            hierarchyFilterText:hierarchyFilterText,
            setHierarchyFilterText:setHierarchyFilterText,
            workflowFilterText:workflowFilterText,
            setWorkflowFilterText:setWorkflowFilterText
        }}>
            <section>
                <header>
                    <Helmet>
                        <title>{t('admin.hierarchy.request.title')} - {tabs.find(t=>t.id==activeTab)?.title}</title>
                    </Helmet>
                    <Row>
                        <Col>
                            <h2>{t('admin.hierarchy.request.title')}</h2>
                        </Col>
                    </Row>
                </header>
                <Tabs activeKey={activeTab} onSelect={navigate} id="request-hierarchy-tabs">
                    {tabs.map(t => (
                        <Tab key={t.id} eventKey={t.id} title={t.title}>
                            <Container as="article" className="mt-3" fluid>
                                <Row as="header">
                                    <Col as="h3">{t.title} <AppButton format="add" onClick={()=>setIsNew(t.id)}>New</AppButton></Col>
                                </Row>
                                <HierarchyRouter tab={t.id}/>
                            </Container>
                        </Tab>
                    ))}
                </Tabs>
            </section>
        </WorkflowContext.Provider>
    );
}

const HierarchyRouter = React.memo(({tab}) => {
    switch(tab) {
        case "hierarchy": return <AdminRequestHierarchyHierarchy/>;
        case "workflow": return <AdminRequestHierarchyWorkflow/>;
        default: return <NotFound/>;
    }
});

/**
 * Component to display hierarchy chain on both tabs
 */
export function HierarchyChain({list,conditions}) {
    if (!list) return null;
    return (
        <>
            {list.map((g,i) => {
                const cond = find(conditions,(c=>c.seq==i));
                return(
                    <span key={i} className="my-1">
                        <DescriptionPopover
                            id={`group_description_${i}`}
                            title="Group Description"
                            placement="top"
                            flip
                            content={<p>{(!g.GROUP_DESCRIPTION)?<em>No group description</em>:g.GROUP_DESCRIPTION}</p>}
                        >
                            <span>
                                <Badge variant="white" className={`p-2 border ${cond&&'badge-white-striped'}`}>{g.GROUP_NAME}</Badge> 
                                {(i<list.length-1)&&<span><Icon className="iconify-inline m-0 mt-1" icon="mdi:arrow-right"/></span>}
                            </span>
                        </DescriptionPopover>
                    </span>
                );
            })}
        </>
    );
}
