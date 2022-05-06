import React, { useState, lazy, useEffect } from "react";
import { useParams, useHistory } from "react-router-dom";
import { useWorkflowQueries } from "../../../queries/hierarchy";
import useGroupQueries from "../../../queries/groups";
import { find, sortBy } from 'lodash';
import { Container, Row, Col, Tabs, Tab, Badge } from "react-bootstrap";
import { Loading, AppButton } from "../../../blocks/components";
import { Icon } from "@iconify/react";

export const WorkflowContext = React.createContext();
WorkflowContext.displayName = 'WorkflowContext';

const AdminRequestHierarchyHierarchy = lazy(()=>import("../../../blocks/admin/hierarchy/requests/hierarchy"));
const AdminRequestHierarchyWorkflow = lazy(()=>import("../../../blocks/admin/hierarchy/requests/workflow"));

export default function AdminRequestHierarchy() {
    const tabs = [
        {id:'hierarchy',title:'Hierarchy'},
        {id:'workflow',title:'Workflow'}
    ];
    const {pagetab} = useParams();
    const history = useHistory();
    const [activeTab,setActiveTab] = useState('hierarchy');
    const [isNew,setIsNew] = useState('');

    const {getGroups} = useGroupQueries();
    const {getWorkflow} = useWorkflowQueries();
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
        <WorkflowContext.Provider value={{groups:groups.data,workflows:workflows.data,isNew:isNew,setIsNew:setIsNew}}>
            <section>
                <header>
                    <Row>
                        <Col><h2>Request Hierarchy</h2></Col>
                    </Row>
                </header>
                <Tabs activeKey={activeTab} onSelect={navigate} id="position-request-tabs">
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

function HierarchyRouter({tab}) {
    switch(tab) {
        case "hierarchy": return <AdminRequestHierarchyHierarchy/>;
        case "workflow": return <AdminRequestHierarchyWorkflow/>;
        default: return <p>{tab}</p>;
    }
}

/**
 * Component to display hierarchy chain on both tabs
 */
export function HierarchyChain({list,conditions}) {
    return (
        <>
            {list.map((g,i) => {
                const cond = find(conditions,(c=>c.seq==i));
                return(
                    <span key={i} className="my-1">
                        <Badge variant="white" className={`p-2 border ${cond&&'badge-white-striped'}`}>{g.GROUP_NAME}</Badge> 
                        {(i<list.length-1)&&<span><Icon className="iconify-inline m-0 mt-1" icon="mdi:arrow-right"/></span>}
                    </span>
                );
            })}
        </>
    );
}
