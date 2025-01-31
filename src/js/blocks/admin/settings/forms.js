import React, { useState, useCallback, useMemo, useEffect } from "react";
import { Form, Row, Col, Table, ListGroup, Button } from "react-bootstrap";
import { useFormContext, Controller, useWatch } from "react-hook-form";
import { useSettingsContext } from "../../../app";
import useGroupQueries from "../../../queries/groups";
import { useWorkflowQueries } from "../../../queries/hierarchy";
import { find, sortBy, truncate } from 'lodash';
import { HierarchyChain } from "../../../pages/admin/hierarchy/request";
import { Loading } from "../../components";
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { Icon } from "@iconify/react";

export default function SettingsForms() {
    return (
        <>
            <SettingsFormsMenu/>
            <SettingsFormsAgeWarning/>
            <SettingsFormsDefaultRouting/>
            <SettingsFormsEmail/>
        </>
    );
}

function SettingsFormsMenu() {
    const [menuItems,setMenuItems] = useState([]);
    const { control, setValue } = useFormContext();
    const menuFields = useWatch({name:'forms.menu',control:control});
    const { forms } = useSettingsContext();
    const disabled = useCallback(field => {
        const k = field.name.split('.')[2];
        return (Object.keys(menuFields[k]).includes('enabled'))?!menuFields[k].enabled:false;
    },[menuFields]);

    const handleDragEnd = result => {
        if (!result.destination) return;
        const newMenuItems = [...menuItems];
        const [moved] = newMenuItems.splice(result.source.index,1);
        newMenuItems.splice(result.destination.index,0,moved);
        newMenuItems.forEach((item,index) => {
            setValue(`forms.menu.${item}.order`,index, { shouldDirty: true });
        });
        setMenuItems(newMenuItems);
    };

    useEffect(() => {
        setMenuItems(Object.keys(menuFields).sort((a,b) => parseInt(menuFields[a].order,10)>parseInt(menuFields[b].order,10)?1:parseInt(menuFields[a].order,10)==parseInt(menuFields[b].order,10)?0:-1));
    },[menuFields]);

    return (
        <DragDropContext onDragEnd={handleDragEnd}>
            <Droppable droppableId="order">
                {(provided,snapshot) => (
                    <section
                        className="menu-items"
                        ref={provided.innerRef}
                        {...provided.droppableProps} 
                    >
                        {menuItems.map((k,i) => (
                            <Draggable key={k} draggableId={k} index={i}>
                                {(provided,snapshot) => (
                                    <Form.Group 
                                        ref={provided.innerRef}
                                        {...provided.draggableProps}
                                        as={Row} 
                                        controlId={k}
                                        className={snapshot.isDragging?'dragging':''}
                                    >
                                        <Form.Label column md={2}>
                                            <span {...provided.dragHandleProps}><Icon icon="mdi:reorder-horizontal" className="iconify-inline drag-handle" width={24} height={24}/></span>
                                            <span>{k}:</span>
                                        </Form.Label>
                                        <Col xs="auto">
                                            <Controller
                                                name={`forms.menu.${k}.title`}
                                                control={control}
                                                defaultValue={forms.menu[k].title}
                                                render={({field}) => <Form.Control {...field} type="text" placeholder="Enter Title" disabled={disabled(field)}/>}
                                            />
                                        </Col>
                                        <Col xs="auto">
                                            <Controller
                                                name={`forms.menu.${k}.showOnHome`}
                                                control={control}
                                                render={({field}) => <Form.Check {...field} type="checkbox" inline label="Show On Home" checked={field.value} disabled={disabled(field)}/>}
                                            />
                                        </Col>
                                        <Col xs="auto">
                                            <Controller
                                                name={`forms.menu.${k}.showOnMenu`}
                                                control={control}
                                                render={({field}) => <Form.Check {...field} type="checkbox" inline label="Show On Menu" checked={field.value} disabled={disabled(field)}/>}
                                            />
                                        </Col>
                                        {Object.keys(forms.menu[k]).includes('resubmit') && 
                                            <Col xs="auto">
                                                <Controller
                                                    name={`forms.menu.${k}.resubmit`}
                                                    control={control}
                                                    render={({field}) => <Form.Check {...field} type="checkbox" inline label="Allow Resubmit" checked={field.value} disabled={disabled(field)}/>}
                                                />
                                            </Col>
                                        }
                                        {Object.keys(forms.menu[k]).includes('enabled') && 
                                            <Col xs="auto">
                                                <Controller
                                                    name={`forms.menu.${k}.enabled`}
                                                    control={control}
                                                    render={({field}) => <Form.Check {...field} type="checkbox" inline label="Enabled" checked={field.value}/>}
                                                />
                                            </Col>
                                        }
                                    </Form.Group>
                                )}
                            </Draggable>
                        ))}
                        {provided.placeholder}
                    </section>
                )}
            </Droppable>
        </DragDropContext>
    );
}

function SettingsFormsAgeWarning() {
    const { control } = useFormContext();
    const enabled = useWatch({name:'forms.agewarn.enabled',control:control});

    return (
        <section>
            <Row as="header" className="mt-3">
                <Col as="h4">Age Warning</Col>
            </Row>
            <Form.Group as={Row} controlId="formsAgeWarn">
                <Form.Label column md={2}>Enable Age Warning:</Form.Label>
                <Col xs="auto" className="pt-2">
                    <Controller
                        name='forms.agewarn.enabled'
                        control={control}
                        render={({field}) => <Form.Check {...field} type="checkbox" checked={!!field.value}/>}
                    />
                </Col>
                <Col xs="auto">
                    <Controller
                        name='forms.agewarn.age'
                        control={control}
                        render={({field}) => <Form.Control {...field} type="number" min={0} placeholder="Enter Min Age (in days)" disabled={!enabled} />}
                    />
                </Col>
            </Form.Group> 
        </section>
    );
}

function SettingsFormsDefaultRouting() {
    const [searchText,setSearchText] = useState('');

    const { control, getValues, setValue } = useFormContext();

    const { getGroups } = useGroupQueries();
    const { getWorkflow } = useWorkflowQueries('form');
    const groups = getGroups({select:d=>sortBy(d,['GROUP_NAME']),initialData:[]});
    const workflows = getWorkflow({
        enabled:!!groups.data,
        select:d=>{
            const selectedWF = getValues('forms.defaultWorkflow');
            if (selectedWF != "" && d.length > 0) {
                const selectedIdx = d.findIndex(w=>w.WORKFLOW_ID==selectedWF);
                if (selectedIdx > 0) {
                    const selectedWFData = d.splice(selectedIdx,1);
                    d.unshift(selectedWFData.at(0));
                }
            }
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
    const clearDefault = ()=>setValue('forms.defaultWorkflow','');
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
                        <Form.Group as={Col} controlId="formWorkflowId">
                            <Form.Label>Current Workflow: <Button title="Clear" variant="danger" style={{padding:'0.1rem 0.25rem',fontSize:'0.8rem'}} onClick={clearDefault}>X</Button></Form.Label>
                            <Controller
                                name="forms.defaultWorkflow"
                                control={control}
                                render={({field}) => (
                                    <div className="border rounded p-3 bg-secondary-light">
                                        <HierarchyChain list={selectedWorkflow(field.value)?.GROUPS_ARRAY} conditions={selectedWorkflow(field.value)?.CONDITIONS}/>
                                    </div>
                                )}
                            />
                        </Form.Group>
                    </Form.Row>            
                    <Form.Group as={Row} controlId="formWorkflowSearch">
                        <Form.Label column md={2}>Workflow Search:</Form.Label>
                        <Col xs="auto">
                            <Form.Control type="search" placeholder="search workflows..." onChange={e=>setSearchText(e.target.value)} />
                        </Col>
                    </Form.Group>
                    <Form.Row>
                        <Form.Group as={Col} sm={{offset:2}} controlId="workflowListGroup">
                        <Controller
                            name="forms.defaultWorkflow"
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

function SettingsFormsEmail() {
    const { getGroups } = useGroupQueries();
    const groups = getGroups({select:d=>sortBy(d,['GROUP_NAME']),initialData:[]});
    const { control } = useFormContext();
    const enabled = useWatch({name:'forms.email.enabled',control:control});
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
                            name='forms.email.enabled'
                            control={control}
                            render={({field}) => <Form.Check {...field} type="checkbox" checked={!!field.value}/>}
                        />
                    </Col>
                </Form.Group>
                <Form.Group as={Row} controlId="emailFromName">
                    <Form.Label column md={2}>From Name (optional):</Form.Label>
                    <Col xs="auto">
                        <Controller
                            name='forms.email.name'
                            control={control}
                            render={({field}) => <Form.Control {...field} type="text" placeholder="Enter From Email Name" disabled={!enabled}/>}
                        />
                    </Col>
                </Form.Group>
                <Form.Group as={Row} controlId="emailFrom">
                    <Form.Label column md={2}>From Email:</Form.Label>
                    <Col xs="auto">
                        <Controller
                            name='forms.email.from'
                            control={control}
                            render={({field}) => <Form.Control {...field} type="email" placeholder="Enter From Email Address" disabled={!enabled} />}
                        />
                    </Col>
                </Form.Group>
                <Form.Group as={Row} controlId="emailSubject">
                    <Form.Label column md={2}>Email Subject:</Form.Label>
                    <Col xs="auto">
                        <Controller
                            name='forms.email.subject'
                            control={control}
                            render={({field}) => <Form.Control {...field} type="text" placeholder="Enter Email Subject" disabled={!enabled} />}
                        />
                    </Col>
                </Form.Group>
                <Form.Group as={Row} controlId="emailErrors">
                    <Form.Label column md={2}>Errors Group:</Form.Label>
                    <Col xs="auto">
                        <Controller
                            name='forms.email.errorsGroup'
                            control={control}
                            render={({field}) => (
                                <Form.Control as="select" {...field} aria-describedby="emailErrorsGroupHelp" disabled={!enabled} >
                                    <option></option>
                                    {groups.data.map(g=><option value={g.GROUP_ID} key={g.GROUP_ID}>{g.GROUP_NAME}</option>)}
                                </Form.Control>
                            )}
                        />
                        <Form.Text id="emailErrorsGroupHelp" className="pt-1" muted>Group notified when errors are encountered in the Form process</Form.Text>
                    </Col>
                </Form.Group>
            </section>
           {enabled && <SettingsFormsEmailStatus/>}
        </>
    );
}

function SettingsFormsEmailStatus() {
    const { control, setValue } = useFormContext();
    const { forms } = useSettingsContext();
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

    const handleMailChange = (e,field) => {
        const value = new Set(field.value);
        if (e.target.checked) {
            value.add(e.target.value);
        } else {
            value.delete(e.target.value);
        }
        setValue(field.name,Array.from(value));
    }

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
                    {Object.keys(forms.email.status).map(s => (
                        <tr key={s}>
                            <td>{s}</td>
                            <td>
                                <Controller
                                    name={`forms.email.status.${s}.subject`}
                                    control={control}
                                    render={({field}) => <Form.Control {...field} type="text" placeholder="Enter Subject"/>}
                                />
                            </td>
                            <td>{mailOptions.map(o=>(
                                <Controller
                                    key={`mailto_${o[0]}`}
                                    name={`forms.email.status.${s}.mailto`}
                                    control={control}
                                    render={({field}) => <Form.Check {...field} type="checkbox" label={o[1]} checked={field.value.includes(o[0])} onChange={e=>handleMailChange(e,field)} value={o[0]}/>}
                                />
                            ))}</td>
                            <td>{mailOptions.map(o=>(
                                <Controller
                                    key={`mailcc_${o[0]}`}
                                    name={`forms.email.status.${s}.mailcc`}
                                    control={control}
                                    render={({field}) => <Form.Check {...field} type="checkbox" label={o[1]} checked={field.value.includes(o[0])} onChange={e=>handleMailChange(e,field)} value={o[0]}/>}
                                />
                            ))}</td>
                            <td>{replyToOptions.map(o=>(
                                <Controller
                                    key={`mailcc_${o[0]}`}
                                    name={`forms.email.status.${s}.replyto`}
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

function TestFieldArray() {

}