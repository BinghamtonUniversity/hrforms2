import React, { useState, lazy, useEffect, useMemo, useCallback } from "react";
import { useQueryClient } from "react-query";
import { Row, Col, Form, Tabs, Tab, Container, Alert, Button } from "react-bootstrap";
import { useForm, FormProvider, useFormContext } from "react-hook-form";
import { AppButton, DescriptionPopover, Loading, errorToast } from "../../blocks/components";
import { toast } from "react-toastify";
import { t } from "../../config/text";
import { NotFound, lazyRetry } from "../../app";
import useSettingsQueries from "../../queries/settings";
import { useHistory, useParams, Link } from "react-router-dom";
import { Helmet } from "react-helmet";
import { SettingsPageContext, tabs, defaultVals, useSettingsPageContext } from "../../config/settings";
import useSimulateQueries from "../../queries/simulate";
import { useWorkflowQueries } from "../../queries/hierarchy";
import useGroupQueries from "../../queries/groups";
import { sortBy, find, get } from "lodash";
import { Icon } from "@iconify/react/dist/iconify.js";
import DataTable from "react-data-table-component";

/* N.B. Must use t.id instead of activeTab or radio options will not work */

const SettingsRequests = lazy(()=>lazyRetry(()=>import("../../blocks/admin/settings/requests")));
const SettingsForms = lazy(()=>lazyRetry(()=>import("../../blocks/admin/settings/forms")));
const SettingsGeneral = lazy(()=>lazyRetry(()=>import("../../blocks/admin/settings/general")));
const SettingsWorkflow = lazy(()=>lazyRetry(()=>import("../../blocks/admin/settings/workflow")));

export default function AdminSettings() {
    const { getSettings } = useSettingsQueries();
    const settings = getSettings();
    if (settings.isError) return <Loading isError>Error Loading Settings</Loading>
    if (settings.isLoading) return <Loading>Loading Settings</Loading>
    if (!settings.isSuccess) return null;
    return <AdminSettingsTabs settingsData={settings.data}/>
}

function AdminSettingsTabs({settingsData}) {
    const { subpage } = useParams();
    const history = useHistory();

    const [activeTab,setActiveTab] = useState('general');
    const [groupsData,setGroupsData] = useState([]);

    //TODO: can we abstract this up to the top level and share with tabs?
    const { getGroups } = useGroupQueries();
    const groups = getGroups({select:d=>sortBy(d,['GROUP_NAME'])});

    const navigate = tab => {
        setActiveTab(tab);
        history.push('/admin/settings/'+tab);
    }

    const methods = useForm({mode:'onBlur',defaultValues:defaultVals,values:settingsData});

    const queryclient = useQueryClient();
    const { putSettings } = useSettingsQueries();
    const update = putSettings();
    const handleSubmit = data => {
        console.debug('Save Settings: ',data);
        toast.promise(update.mutateAsync(data),{
            pending:'Saving Settings...',
            success:{
                render:() => {
                    queryclient.invalidateQueries('settings');
                    return 'Settings saved successfully';    
                }
            },
            error:errorToast('Failed saving settings')
        });
    }
    const handleError = error => {
        console.error(error);
    }
    const handleReset = () => methods.reset(settingsData);
    const handleFieldReset = (e,field) => {
        e.preventDefault();
        methods.resetField(field);
    }
    useEffect(()=>groups.status=='success'&&setGroupsData(groups.data),[groups]);
    useEffect(()=>setActiveTab(tabs.map(t=>t.id).includes(subpage)?subpage:'general'),[subpage]);
    useEffect(() => ()=>{
        queryclient.removeQueries('workflow');
        groups.remove();
    },[]);
    if (groups.isError) return <Loading isError>Error Loading Data</Loading>
    if (groups.isLoading) return <Loading>Loading Data</Loading>
    return (
        <>
            <header>
                <Helmet>
                    <title>{t('admin.settings.title')} - {tabs.filter(t=>t.id==activeTab).at(0)?.title}</title>
                </Helmet>
                <Row>
                    <Col>
                        <h2>{t('admin.settings.title')}</h2>
                    </Col>
                </Row>
                {!!Object.keys(methods.formState.dirtyFields).length && 
                    <Row>
                        <Col>
                            <Alert variant="warning">
                                <Icon className="iconify-inline" icon="mdi:alert" /> Unsaved Changes
                            </Alert>
                        </Col>
                    </Row>
                }
            </header>
            <section>
                <Alert variant="info">
                    <p className="mb-0">These settings apply globally to the application and affect all users.</p>
                </Alert>
            </section>
            <section>
                <FormProvider {...methods}>
                    <SettingsPageContext.Provider value={{groups:groupsData,handleFieldReset:handleFieldReset}}>
                        <Form onSubmit={methods.handleSubmit(handleSubmit,handleError)} onReset={handleReset}>
                            <Row>
                                <Col>
                                    <Tabs activeKey={activeTab} onSelect={navigate} id="settings-tabs">
                                        {tabs.map(t=>(
                                            <Tab key={t.id} eventKey={t.id} title={t.title}>
                                                <Container as="article" className="mt-3" fluid>
                                                    <Row as="header">
                                                        <Col as="h3">{t.title}</Col>
                                                    </Row>
                                                    <SettingsRouter tab={activeTab}/>
                                                </Container>
                                            </Tab>
                                        ))}
                                    </Tabs>
                                </Col>
                            </Row>
                            <Row as="footer">
                                <Col className="button-group justify-content-end align-items-center">
                                    {!!Object.keys(methods.formState.dirtyFields).length && <p className="mb-1 text-warning"><Icon icon="mdi:alert" /> Unsaved Changes!</p>}
                                    <AppButton format="reset" type="reset">Reset</AppButton>
                                    <AppButton format="save" type="submit">Save</AppButton>
                                </Col>
                            </Row>
                        </Form>
                    </SettingsPageContext.Provider>
                </FormProvider>
            </section>
        </>
    );
}

const SettingsRouter = React.memo(({tab}) => {
    switch(tab) {
        case "general": return <SettingsGeneral/>;
        case "workflow": return <SettingsWorkflow/>;
        case "requests": return <SettingsRequests/>;
        case "forms": return <SettingsForms/>;
        default: return <NotFound/>;
    }
});

export function WorkflowGroupsComponent({type,wfId,wfGroups}) {
    return (
        <>
            {wfGroups.map(g => g.GROUP_NAME).join(' → ')}
        </>
    );
}

export function SettingsSimulateEmail({type}) {
    const [id,setId] = useState('');
    const [showSimulate,setShowSimulate] = useState(false);
    const [data,setData] = useState();
    
    const { getValues } = useFormContext();
    const { groups } = useSettingsPageContext();
    const { postSimulate } = useSimulateQueries();
    const post = postSimulate();
    
    const { getWorkflow } = useWorkflowQueries(type);
    const workflows = getWorkflow({
        enabled:!!groups?.length,
        select:d=>{
            return d.map(w => {
                w.GROUPS_ARRAY = w.GROUPS.split(',').map(g => {
                    const name = find(groups,{GROUP_ID:g.toString()})
                    return {GROUP_ID:g,GROUP_NAME:name?.GROUP_NAME}
                });
                return w;
            });
        },
        placeHolderData:[]
    });
    
    const simulate = () => {
        const t = new Map([['form','forms'],['request','requests']])
        const settings = getValues(`${t.get(type)}.email`);
        toast.promise(post.mutateAsync({type,id,settings}),{
            pending:'Running simulation...',
            success:{
                render:d => {
                    setData(d?.data);
                    setShowSimulate(true);
                    return 'Simulation completed successfully';    
                }
            },
            error:errorToast('Failed running simulation')
        });
    }
    return (
        <section>
            <header>
                <h3>Email Simulation</h3>
            </header>
            <article className="form-inline gap-2">
                <Form.Label>Workflow ID:</Form.Label>
                <Form.Control as="select" onChange={e=>setId(e.target.value)} value={id} disabled={showSimulate}>
                    <option></option>
                    {workflows.data && workflows.data.map(w => (
                        <option key={w.WORKFLOW_ID} value={w.WORKFLOW_ID}>
                            {w.WORKFLOW_ID}: {w.GROUPS_ARRAY.map(g => g.GROUP_NAME).join(' → ')}
                        </option>
                    ))}
                </Form.Control>                
                <Button variant="danger" onClick={simulate} disabled={id === ''}>Test</Button>
                <Button variant="secondary" onClick={()=>{setId('');setShowSimulate(false);}}>Clear</Button>
            </article>
            {(showSimulate && data) && <Simulate data={data} type={type}/>}
        </section>
    );
}

function Simulate({data,type}) {
    const { groups } = useSettingsPageContext();
    const { getValues } = useFormContext();
    const getGroupName = useCallback(groupId => {
        if (groupId == '-99') return "SUBMITTER";
        const group_name = groups.find(g => g.GROUP_ID == groupId)?.GROUP_NAME;
        if (group_name) return group_name;
        return groupId;
    },[groups]);

    const simulateData = useMemo(() => {
        const t = new Map([['form','forms'],['request','requests']])
        const settings = getValues(`${t.get(type)}.email`);
        return data.map(row => {
            const statusCode = Object.keys(row)[0];
            const statusCodeName = get(settings,`status.${statusCode}.subject`);
            const email = row[statusCode]['email'];
            return {
                status: statusCode,
                statusCodeName:statusCodeName,
                groupFrom: getGroupName(row[statusCode]['groups'][0]),
                groupFromId: row[statusCode]['groups'][0],
                groupTo: getGroupName(row[statusCode]['groups'][1]),
                groupToId: row[statusCode]['groups'][1],
                subject: typeof email == 'object' ? email.subject : email,
                to: typeof email == 'object' ? email.mailto || [] : [],
                cc: typeof email == 'object' ? email.mailcc || [] : [],
                replyTo: typeof email == 'object' ? email.replyto : ''
            };
        });
    }, [data, getGroupName]);
    
    return (
        <section>
            <SimulateTable data={simulateData} exclude={['R','X']}/>
            <SimulateTable data={simulateData} include={['R']} title="Rejected"/>
            <SimulateTable data={simulateData} include={['X']} title="Skipped"/>
        </section>
    );
}

function SimulateTable({data,include,exclude,title}) {
    const columns = useMemo(() => [
        {name:'Status',selector:row=>(
            <DescriptionPopover
                id={`${row.status}_status_description`}
                content={row.statusCodeName}
            >
                <p className="mb-0">{row.status}</p>
            </DescriptionPopover>
        ),width:'100px'},
        {name:'Group From', selector: row => {
            if (!row.groupFromId) return null;
            return (
                <p className="m-0">
                    { row.groupFromId != '-99' &&
                        <Link to={`/admin/groups/?search=id:${row.groupFromId}`} className="btn btn-sm btn-info py-0"><Icon icon="mdi:jump"/></Link>
                    } {row.groupFrom}
                </p>
            );
        }},
        {name:'Group To', selector: row => {
            if (!row.groupToId) return null;
            return (
                <p className="m-0">
                    { row.groupToId != '-99' &&
                        <Link to={`/admin/groups/?search=id:${row.groupToId}`} className="btn btn-sm btn-info py-0"><Icon icon="mdi:jump"/></Link>
                    } {row.groupTo}
                </p>
            );
        }},
        {name:'Subject', selector: row => row.subject, wrap:true},
        {name:'To', selector: row => {
            return (
                <div className="my-1">
                    {row.to.map(email => (
                        <p key={email} className="m-0">{email}</p>
                    ))}
                </div>
            );
        }, wrap:true},
        {name:'CC', selector: row => {
            return (
                <div className="my-1">
                    {row.cc.map(email => (
                        <p key={email} className="m-0">{email}</p>
                    ))}
                </div>
            );
        }, wrap:true},
        {name:'Reply To', selector: row => row.replyTo}
    ], []);

    const filteredData = useMemo(() => data.filter(row => {
        if (include && !include.includes(row.status)) return false;
        if (exclude && exclude.includes(row.status)) return false;
        return true;
    }), [data, include, exclude]);

    return (
            <article className="my-2">
                {title && 
                <header>
                    <h3>{title}</h3>
                </header>
                }
                <DataTable 
                    columns={columns}
                    data={filteredData}
                    pagination={false}
                    striped
                    responsive
                    noDataComponent={<p className="m-3">No Data</p>}
                />
            </article>

    )
}

