import React, { useState, useCallback, useMemo, useEffect } from "react";
import { Form, Row, Col, Table, ListGroup, Button } from "react-bootstrap";
import { useFormContext, Controller, useWatch } from "react-hook-form";
import { useSettingsContext } from "../../../app";
import useGroupQueries from "../../../queries/groups";
import { useWorkflowQueries } from "../../../queries/hierarchy";
import { find, sortBy,truncate } from 'lodash';
import { HierarchyChain } from "../../../pages/admin/hierarchy/request";
import { Loading } from "../../components";

export default function SettingsRequests() {
    const { control } = useFormContext();
    const menuFields = useWatch({name:'requests.menu',control:control});
    const { requests } = useSettingsContext();
    const disabled = useCallback(field => {
        const k = field.name.split('.')[2];
        return (Object.keys(menuFields[k]).includes('enabled'))?!menuFields[k].enabled:false;
    },[menuFields]);
    return (
        <>
            <section>
                {Object.keys(requests.menu).map(k=>(
                    <Form.Group key={k} as={Row} controlId={k}>
                        <Form.Label column md={2}>{k}:</Form.Label>
                        <Col xs="auto">
                            <Controller
                                name={`requests.menu.${k}.title`}
                                control={control}
                                defaultValue={requests.menu[k].title}
                                render={({field}) => <Form.Control {...field} type="text" placeholder="Enter Title" disabled={disabled(field)}/>}
                            />
                        </Col>
                        <Col xs="auto">
                            <Controller
                                name={`requests.menu.${k}.showOnHome`}
                                control={control}
                                render={({field}) => <Form.Check {...field} type="checkbox" inline label="Show On Home" checked={field.value} disabled={disabled(field)}/>}
                            />
                        </Col>
                        <Col xs="auto">
                            <Controller
                                name={`requests.menu.${k}.showOnMenu`}
                                control={control}
                                render={({field}) => <Form.Check {...field} type="checkbox" inline label="Show On Menu" checked={field.value} disabled={disabled(field)}/>}
                            />
                        </Col>
                        {Object.keys(requests.menu[k]).includes('resubmit') && 
                            <Col xs="auto">
                                <Controller
                                    name={`requests.menu.${k}.resubmit`}
                                    control={control}
                                    render={({field}) => <Form.Check {...field} type="checkbox" inline label="Allow Resubmit" checked={field.value} disabled={disabled(field)}/>}
                                />
                            </Col>
                        }
                        {Object.keys(requests.menu[k]).includes('enabled') && 
                            <Col xs="auto">
                                <Controller
                                    name={`requests.menu.${k}.enabled`}
                                    control={control}
                                    render={({field}) => <Form.Check {...field} type="checkbox" inline label="Enabled" checked={field.value}/>}
                                />
                            </Col>
                        }
                    </Form.Group>
                ))}
            </section>
            <SettingsRequestsDefaultRouting/>
            <SettingsRequestsEmail/>
        </>
    );
}

function SettingsRequestsDefaultRouting() {
    const [searchText,setSearchText] = useState('');

    const { control, setValue } = useFormContext();

    const { getGroups } = useGroupQueries();
    const { getWorkflow } = useWorkflowQueries('request');
    const groups = getGroups({select:d=>sortBy(d,['GROUP_NAME'])});
    const workflows = getWorkflow({
        enabled:!!groups.data,
        select:d=>{
            return d.map(w => {
                w.GROUPS_ARRAY = w.GROUPS.split(',').map(g => {
                    const name = find(groups.data,{GROUP_ID:g})
                    return {GROUP_ID:g,GROUP_NAME:name?.GROUP_NAME}
                });
                return w;
            });
        },
        initialData:[]
    });

    const listItemClick = (e,field) => {
        e.preventDefault();
        field.onChange(e.target.value);
    };

    const filteredWorkflows = useMemo(() => workflows.data.filter(w => w.GROUPS_ARRAY.map(g=>g.GROUP_NAME.toLowerCase()).join(' ').includes(searchText.toLocaleLowerCase())),[searchText,workflows]);
    const selectedWorkflow = useCallback((workflowId) => workflows.data.filter(w=>w.WORKFLOW_ID==workflowId)[0],[workflows]);
    const clearDefault = ()=>setValue('requests.workflow.default','');
    return (
        <section>
            <Row as="header" className="mt-3">
                <Col as="h4">Default Routing</Col>
            </Row>
            {(workflows.data.length == 0) && <Loading type="alert">Loading Workflows...</Loading>}
            {workflows.isError && <Loading type="alert" isError>Error Loading Workflows</Loading>}
            {workflows.data.length > 0 &&
                <>
                    <Form.Row>
                        <Form.Group as={Col} controlId="requestWorkflowId">
                            <Form.Label>Current Workflow: <Button title="Clear" variant="danger" style={{padding:'0.1rem 0.25rem',fontSize:'0.8rem'}} onClick={clearDefault}>X</Button></Form.Label>
                            <Controller
                                name="requests.defaultWorkflow"
                                defaultValue={undefined}
                                control={control}
                                render={({field}) => (
                                    <div className="border rounded p-3 bg-secondary-light">
                                        <HierarchyChain list={selectedWorkflow(field.value)?.GROUPS_ARRAY} conditions={selectedWorkflow(field.value)?.CONDITIONS}/>
                                    </div>
                                )}
                            />
                        </Form.Group>
                    </Form.Row>            
                    <Form.Group as={Row} controlId="requestWorkflowSearch">
                        <Form.Label column md={2}>Workflow Search:</Form.Label>
                        <Col xs="auto">
                            <Form.Control type="search" placeholder="search workflows..." onChange={e=>setSearchText(e.target.value)} />
                        </Col>
                    </Form.Group>
                    <Form.Row>
                        <Form.Group as={Col} sm={{offset:2}} controlId="workflowListGroup">
                        <Controller
                            name="requests.workflow.default"
                            control={control}
                            render={({field}) => (
                                <ListGroup className="border list-group-condensed list-group-scrollable-25">
                                    {filteredWorkflows.map(w =>( 
                                        <ListGroup.Item key={w.WORKFLOW_ID} action active={field.value==w.WORKFLOW_ID} onClick={e=>listItemClick(e,field)} value={w.WORKFLOW_ID}>{w.WORKFLOW_ID}:{' '}
                                            {truncate(w.GROUPS_ARRAY.map(g=>g.GROUP_NAME).join(' > '),{length:80,separator:' > '})}
                                        </ListGroup.Item>))
                                    }
                                </ListGroup>
                            )}
                        />
                        </Form.Group>
                    </Form.Row>
                </>
            }
        </section>
    );
}

function SettingsRequestsEmail() {
    const { control } = useFormContext();
    const enabled = useWatch({name:'requests.email.enabled',control:control});
    return (
        <>
            <section>
                <Row as="header" className="mt-3">
                    <Col as="h4">Email Configuration</Col>
                </Row>
                <Form.Group as={Row} controlId="emailEnabled">
                    <Form.Label column md={2}>Enable Notifications:</Form.Label>
                    <Col xs="auto" className="pt-2">
                        <Controller
                            name='requests.email.enabled'
                            control={control}
                            render={({field}) => <Form.Check {...field} type="checkbox" checked={!!field.value}/>}
                        />
                    </Col>
                </Form.Group>
                <Form.Group as={Row} controlId="emailFromName">
                    <Form.Label column md={2}>From Name (optional):</Form.Label>
                    <Col xs="auto">
                        <Controller
                            name='requests.email.name'
                            control={control}
                            render={({field}) => <Form.Control {...field} type="text" placeholder="Enter From Email Name" disabled={!enabled}/>}
                        />
                    </Col>
                </Form.Group>
                <Form.Group as={Row} controlId="emailFrom">
                    <Form.Label column md={2}>From Email:</Form.Label>
                    <Col xs="auto">
                        <Controller
                            name='requests.email.from'
                            control={control}
                            render={({field}) => <Form.Control {...field} type="email" placeholder="Enter From Email Address" disabled={!enabled} />}
                        />
                    </Col>
                </Form.Group>
                <Form.Group as={Row} controlId="emailSubject">
                    <Form.Label column md={2}>Email Subject:</Form.Label>
                    <Col xs="auto">
                        <Controller
                            name='requests.email.subject'
                            control={control}
                            render={({field}) => <Form.Control {...field} type="text" placeholder="Enter Email Subject" disabled={!enabled} />}
                        />
                    </Col>
                </Form.Group>
                <Form.Group as={Row} controlId="emailDefault">
                    <Form.Label column md={2}>Default Email:</Form.Label>
                    <Col xs="auto">
                        <Controller
                            name='requests.email.default'
                            control={control}
                            render={({field}) => <Form.Control {...field} type="email" placeholder="Enter Default To Email Address" aria-describedby="emailDefaultHelp" disabled={!enabled}/>}
                        />
                    </Col>
                    <Col>
                        <Form.Text id="emailDefaultHelp" className="pt-1" muted>Default email to send to when there are no approval group members or no members set to receive email notifications.</Form.Text>
                    </Col>
                </Form.Group>
                <Form.Group as={Row} controlId="emailErrors">
                    <Form.Label column md={2}>Errors Email:</Form.Label>
                    <Col xs="auto">
                        <Controller
                            name='requests.email.errors'
                            control={control}
                            render={({field}) => <Form.Control {...field} type="email" placeholder="Enter Email Address" aria-describedby="emailErrorsHelp" disabled={!enabled}/>}
                        />
                    </Col>
                    <Col>
                        <Form.Text id="emailErrorsHelp" className="pt-1" muted>Email to send errors to.</Form.Text>
                    </Col>
                </Form.Group>
            </section>
            {enabled && <SettingsRequestsEmailStatus/>}
        </>
    );
}

function SettingsRequestsEmailStatus() {
    const { control } = useFormContext();
    const { requests } = useSettingsContext();
    const mailOptions = [
        ["submitter","Submitter"],
        ["group_to","Group To"],
        ["group_from","Group From"],
        ["default","Default"],
        ["error","Error"]
    ];
    const replyToOptions = [
        ["none","None"],
        ["submitter","Submitter"],
        ["default","Default"],
        ["error","Error"]
    ];
    return (
        <>
            <Table striped bordered>
                <thead>
                    <tr>
                        <th>Code</th>
                        <th>Subject</th>
                        <th>Email To</th>
                        <th>Email Cc</th>
                        <th>Email Reply-To</th>
                    </tr>
                </thead>
                <tbody>
                    {Object.keys(requests.email.status).map(s => (
                        <tr key={s}>
                            <td>{s}</td>
                            <td>
                                <Controller
                                    name={`requests.email.status.${s}.subject`}
                                    control={control}
                                    render={({field}) => <Form.Control {...field} type="text" placeholder="Enter Subject"/>}
                                />
                            </td>
                            <td>{mailOptions.map(o=>(
                                <Controller
                                    key={`mailto_${o[0]}`}
                                    name={`requests.email.status.${s}.mailto.${o[0]}`}
                                    control={control}
                                    render={({field}) => <Form.Check {...field} type="checkbox" label={o[1]} checked={field.value}/>}
                                />
                            ))}</td>
                            <td>{mailOptions.map(o=>(
                                <Controller
                                    key={`mailcc_${o[0]}`}
                                    name={`requests.email.status.${s}.mailcc.${o[0]}`}
                                    control={control}
                                    render={({field}) => <Form.Check {...field} type="checkbox" label={o[1]} checked={field.value}/>}
                                />
                            ))}</td>
                            <td>{replyToOptions.map(o=>(
                                <Controller
                                    key={`mailcc_${o[0]}`}
                                    name={`requests.email.status.${s}.replyto`}
                                    control={control}
                                    render={({field}) => <Form.Check {...field} type="radio" label={o[1]} value={o[0]} checked={field.value==o[0]}/>}
                                />
                            ))}</td>
                        </tr>
                    ))}
                </tbody>
            </Table>
        </>
    );
}
