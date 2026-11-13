import React, { useState, useCallback, useMemo, useEffect } from "react";
import { Form, Row, Col, Table, ListGroup, OverlayTrigger, Tooltip } from "react-bootstrap";
import { useFormContext, Controller, useWatch } from "react-hook-form";
import { useSettingsContext } from "../../../app";
import { useWorkflowQueries } from "../../../queries/hierarchy";
import { find } from 'lodash';
import { HierarchyChain } from "../../../pages/admin/hierarchy/request";
import { AppButton, Loading } from "../../components";
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { Icon } from "@iconify/react";
import { useSettingsPageContext, mailOptions } from "../../../config/settings";
import { SettingsSimulateEmail, WorkflowGroupsComponent } from "../../../pages/admin/settings";
import { flattenObject } from "../../../utility";

export default function SettingsForms() {
    return (
        <>
            <DashBoardCardTitle/>
            <SettingsFormsMenu/>
            <SettingsFormsPermissions/>
            <SettingsFormsAgeWarning/>
            <SettingsFormsDefaultRouting/>
            <SettingsFormsEmail/>
        </>
    );
}

function InputComponentWithReset({type,field,isDirty,...props}) {
    const className = isDirty ? 'bg-warning-light' : '';
    return (
        <div className="d-flex gap-1">
            {type=="checkbox" ? <Form.Check {...field} className={className} {...props}/> : <Form.Control {...field} className={className} {...props}/>}
            <ResetButton field={field} isDirty={isDirty}/>
        </div>
    );
}

function ResetButton({field,isDirty,tooltip}) {
    const { resetField, formState: { dirtyFields } } = useFormContext();
    const settingsFieldReset = (e,field) => {
        if (typeof field === 'string') {
            for (const dirtyField of Object.keys(flattenObject(dirtyFields))) {
                if (dirtyField.startsWith(field)) {
                    resetField(dirtyField);
                }
            }
        } else {
            resetField(field.name);
        }
    }
    return (
        isDirty && (
            <OverlayTrigger placement="auto" overlay={<Tooltip>{tooltip || 'Reset Field'}</Tooltip>}>
                <AppButton format="reset" size="sm" variant="link" className="text-dark font-size-70 p-1" onClick={e=>settingsFieldReset(e,field)}/>
            </OverlayTrigger>
        )
    );
}

function DashBoardCardTitle() {
    const { control} = useFormContext();
    return (
        <Form.Group as={Row}>
            <Form.Label column md={2}>Dashboard Title:</Form.Label>
            <Col xs="auto">
                <Controller
                    name="forms.dashboardTitle"
                    defaultValue=""
                    control={control}
                    render={({field,fieldState:{isDirty}}) => <InputComponentWithReset field={field} isDirty={isDirty} type="text" placeholder="Enter Dashboard Title"/>}
                />
            </Col>
        </Form.Group>
    );
}

function SettingsFormsMenu() {
    const [menuItems,setMenuItems] = useState([]);
    const [orderChanged,setOrderChanged] = useState([]);
    const { control, setValue, formState: { isDirty, dirtyFields } } = useFormContext();
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
        setOrderChanged(Object.keys(flattenObject(dirtyFields)).filter(m=>m.endsWith('.order')));
    };

    const resetOrder = () => {
        const newMenuItems = [];
        Object.keys(forms.menu).forEach(k => {
            newMenuItems.push(k);
            setValue(`forms.menu.${k}.order`, forms.menu[k].order, { shouldDirty: false });
        });
        setMenuItems(newMenuItems);
        setOrderChanged([]);
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
                        {menuItems.map((k,i) => {
                            const fieldsChanged = Object.keys(flattenObject(dirtyFields)).filter(m=>m.startsWith(`forms.menu.${k}.`)&&m!=`forms.menu.${k}.order`).length > 0;
                            return (
                            <Draggable key={k} draggableId={k} index={i}>
                                {(provided,snapshot) => (
                                    <Form.Group 
                                        ref={provided.innerRef}
                                        {...provided.draggableProps}
                                        as={Row} 
                                        controlId={k}
                                        className={`align-items-center ${snapshot.isDragging ? 'dragging' : ''}`}
                                    >
                                        <Form.Label column md={2} className={`${orderChanged.includes(`forms.menu.${k}.order`) ? 'bg-warning-light' : ''}`}>
                                            <span {...provided.dragHandleProps}><Icon icon="mdi:reorder-horizontal" className="iconify-inline drag-handle" width={24} height={24}/></span>
                                            <span>{k}:</span>
                                        </Form.Label>
                                        <Col xs="auto">
                                            <Controller
                                                name={`forms.menu.${k}.title`}
                                                control={control}
                                                defaultValue={forms.menu[k].title}
                                                render={({field,fieldState:{isDirty}}) => <Form.Control {...field} className={isDirty ? 'bg-warning-light' : ''} type="text" placeholder="Enter Title" disabled={disabled(field)}/>}
                                            />
                                        </Col>
                                        <Col xs="auto">
                                            <Controller
                                                name={`forms.menu.${k}.showOnHome`}
                                                control={control}
                                                render={({field,fieldState:{isDirty}}) => <Form.Check {...field} className={isDirty ? 'bg-warning-light' : ''} type="checkbox" inline label="Show On Home" checked={field.value} disabled={disabled(field)}/>}
                                            />
                                        </Col>
                                        <Col xs="auto">
                                            <Controller
                                                name={`forms.menu.${k}.showOnMenu`}
                                                control={control}
                                                render={({field,fieldState:{isDirty}}) => <Form.Check {...field} className={isDirty ? 'bg-warning-light' : ''} type="checkbox" inline label="Show On Menu" checked={field.value} disabled={disabled(field)}/>}
                                            />
                                        </Col>
                                        {Object.keys(forms.menu[k]).includes('resubmit') && 
                                            <Col xs="auto">
                                                <Controller
                                                    name={`forms.menu.${k}.resubmit`}
                                                    control={control}
                                                    render={({field,fieldState:{isDirty}}) => <Form.Check {...field} className={isDirty ? 'bg-warning-light' : ''} type="checkbox" inline label="Allow Resubmit" checked={field.value} disabled={disabled(field)}/>}
                                                />
                                            </Col>
                                        }
                                        {Object.keys(forms.menu[k]).includes('enabled') && 
                                            <Col xs="auto">
                                                <Controller
                                                    name={`forms.menu.${k}.enabled`}
                                                    control={control}
                                                    render={({field,fieldState:{isDirty}}) => <Form.Check {...field} className={isDirty ? 'bg-warning-light' : ''} type="checkbox" inline label="Enabled" checked={field.value}/>}
                                                />
                                            </Col>
                                        }
                                        {fieldsChanged &&
                                            <ResetButton field={`forms.menu.${k}`} isDirty={isDirty} tooltip="Reset Menu Item Values"/>
                                        }
                                    </Form.Group>
                                )}
                            </Draggable>
                            );
                        })}
                        {provided.placeholder}
                        {orderChanged.length > 0 && 
                            <Row>
                                <AppButton format="reset" variant="outline-warning" onClick={resetOrder}>Reset Order</AppButton>
                            </Row>
                        }
                    </section>
                )}
            </Droppable>
        </DragDropContext>
    );
}

function SettingsFormsPermissions() {
    const { groups } = useSettingsPageContext();
    const { control, formState: { isDirty, dirtyFields } } = useFormContext();
    const enabled = useWatch({name:'forms.permissions.unarchive',control:control});
    return (
        <section>
            <Row as="header" className="mt-3">
                <Col as="h4">Permissions</Col>
            </Row>
            <Form.Group as={Row} controlId="formsApproveOwn">
                <Form.Label column md={2}>Submitter Approve Own:</Form.Label>
                <Col xs="auto" className="pt-2">
                    <Controller
                        name='forms.permissions.approveown'
                        control={control}
                        render={({field,fieldState:{isDirty:isDirtyField}}) => <InputComponentWithReset type="checkbox" field={field} isDirty={isDirtyField } checked={!!field.value}/>}
                    />
                    <Form.Text id="formsApproveOwnHelp" muted>Allow the submitter to approve their own Forms.</Form.Text>
                </Col>
            </Form.Group> 
            <Form.Group as={Row} controlId="formsUnarchive">
                <Form.Label column md={2}>Allow Unarchive:</Form.Label>
                <Col xs="auto" className="pt-2">
                    <Controller
                        name='forms.permissions.unarchive'
                        control={control}
                        render={({field,fieldState:{isDirty:isDirtyField}}) => <InputComponentWithReset type="checkbox" field={field} isDirty={isDirtyField} checked={!!field.value}/>}
                    />
                </Col>
                <Col xs="auto">
                    <Controller
                        name='forms.permissions.unarchive-group'
                        control={control}
                        render={({field,fieldState:{isDirty:isDirtyField}}) => (
                            <Form.Control as="select" {...field} className={isDirtyField ? 'bg-warning-light' : ''} aria-describedby="formsUnarchiveHelp" disabled={!enabled} >
                                <option></option>
                                {groups.map(g=><option value={g.GROUP_ID} key={g.GROUP_ID}>{g.GROUP_NAME}</option>)}
                            </Form.Control>
                        )}
                    />
                    <Form.Text id="formsUnarchiveHelp" muted>Allow Forms to be "Unarchived" and placed back into Pending Final Approval status.</Form.Text>
                </Col>
                {Object.keys(flattenObject(dirtyFields)).filter(k=>k.startsWith('forms.permissions.unarchive')).length>0 && 
                    <ResetButton field="forms.permissions.unarchive" isDirty={isDirty} tooltip="Reset Unarchive Values"/>
                }
            </Form.Group>
        </section>
    );
}

function SettingsFormsAgeWarning() {
    const { control, formState: { isDirty, dirtyFields } } = useFormContext();
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
                        render={({field,fieldState:{isDirty:isDirtyField}}) => <InputComponentWithReset type="checkbox" field={field} isDirty={isDirtyField} checked={!!field.value}/>}
                    />
                </Col>
                <Col xs="auto">
                    <Controller
                        name='forms.agewarn.age'
                        control={control}
                        render={({field,fieldState:{isDirty:isDirtyField}}) => <Form.Control {...field} className={isDirtyField ? 'bg-warning-light' : ''} type="number" min={0} placeholder="Enter Min Age (in days)" disabled={!enabled} />}
                    />
                </Col>
                {Object.keys(flattenObject(dirtyFields)).filter(k=>k.startsWith('forms.agewarn')).length>0 && 
                    <ResetButton field="forms.agewarn" isDirty={isDirty} tooltip="Reset Age Warning Values"/>
                }
            </Form.Group> 
        </section>
    );
}

function SettingsFormsDefaultRouting() {
    const [searchText,setSearchText] = useState('');

    const { control, getValues, setValue, resetField, formState: { isDirty, dirtyFields } } = useFormContext();
    const { groups } = useSettingsPageContext();

    const { getWorkflow } = useWorkflowQueries('form');
    const workflows = getWorkflow({
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
                    const name = find(groups,{GROUP_ID:g})
                    return {GROUP_ID:g,GROUP_NAME:name?.GROUP_NAME}
                });
                return w;
            });
        },
        placeholderData: [],
        staleTime:5*60*1000
    });

    const listItemClick = (e,field,value) => {
        e.preventDefault();
        field.onChange(value);
    };

    const filteredWorkflows = useMemo(() => workflows.data.filter(w => w.GROUPS_ARRAY.map(g=>g.GROUP_NAME&&g.GROUP_NAME.toLowerCase()).join(' ').includes(searchText.toLocaleLowerCase())),[searchText,workflows]);
    const selectedWorkflow = useCallback((workflowId) => workflows.data.filter(w=>w.WORKFLOW_ID==workflowId)[0],[workflows]);
    const clearDefault = ()=>setValue('forms.defaultWorkflow','', {shouldDirty:true});
    const resetDefault = ()=>resetField('forms.defaultWorkflow');

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
                            <div className="d-flex gap-1 align-items-baseline">
                                <Form.Label>Current Workflow:</Form.Label>
                                <AppButton format="clear" variant="danger" size="sm" title="Clear" onClick={clearDefault}>Clear</AppButton>
                                {isDirty && dirtyFields?.forms?.defaultWorkflow &&
                                    <AppButton format="reset" variant="outline-warning" size="sm" title="Reset" onClick={resetDefault}>Reset</AppButton>
                                }
                            </div>
                            <Controller
                                name="forms.defaultWorkflow"
                                control={control}
                                render={({field,fieldState:{isDirty:fieldIsDirty}}) => (
                                    <div className={`border rounded p-3 ${fieldIsDirty ? 'bg-warning-light' : 'bg-secondary-light'}`}>
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
                                <ListGroup className="border list-group-condensed list-group-resizable-25">
                                    {filteredWorkflows.map(w =>( 
                                        <ListGroup.Item key={w.WORKFLOW_ID} className="d-flex gap-1 align-items-center" action active={field.value==w.WORKFLOW_ID} onClick={e=>listItemClick(e,field,w.WORKFLOW_ID)} value={w.WORKFLOW_ID}>
                                            <Col xs="auto">{w.WORKFLOW_ID}:</Col>
                                            <Col className="d-flex">
                                                <WorkflowGroupsComponent type="form" wfId={w.WORKFLOW_ID} wfGroups={w.GROUPS_ARRAY}/>
                                            </Col>
                                        </ListGroup.Item>
                                    ))}
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
    const { control } = useFormContext();
    const { groups } = useSettingsPageContext();
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
                            render={({field,fieldState:{isDirty:isDirtyField}}) => <InputComponentWithReset type="checkbox" field={field} isDirty={isDirtyField } checked={!!field.value}/>}
                        />
                    </Col>
                </Form.Group>
                <Form.Group as={Row} controlId="emailFromName">
                    <Form.Label column md={2}>From Name (optional):</Form.Label>
                    <Col xs="auto">
                        <Controller
                            name='forms.email.name'
                            control={control}
                            render={({field,fieldState:{isDirty}}) => <InputComponentWithReset field={field} isDirty={isDirty} className={isDirty ? 'bg-warning-light' : ''} type="text" placeholder="Enter From Email Name" disabled={!enabled}/>}
                        />
                    </Col>
                </Form.Group>
                <Form.Group as={Row} controlId="emailFrom">
                    <Form.Label column md={2}>From Email:</Form.Label>
                    <Col xs="auto">
                        <Controller
                            name='forms.email.from'
                            control={control}
                            render={({field,fieldState:{isDirty}}) => <InputComponentWithReset field={field} isDirty={isDirty} className={isDirty ? 'bg-warning-light' : ''} type="email" placeholder="Enter From Email Address" disabled={!enabled}/>}                            
                        />
                    </Col>
                </Form.Group>
                <Form.Group as={Row} controlId="emailSubject">
                    <Form.Label column md={2}>Email Subject:</Form.Label>
                    <Col xs="auto" className="d-flex align-items-center gap-1">
                        <Controller
                            name='forms.email.subject'
                            control={control}
                            render={({field,fieldState:{isDirty}}) => <InputComponentWithReset field={field} isDirty={isDirty} className={isDirty ? 'bg-warning-light' : ''} type="text" placeholder="Enter Email Subject" disabled={!enabled}/>}
                        />
                    </Col>
                </Form.Group>
                <Form.Group as={Row} controlId="emailErrors">
                    <Form.Label column md={2}>Errors Group:</Form.Label>
                    <Col xs="auto">
                        <Controller
                            name='forms.email.errorsGroup'
                            control={control}
                            render={({field,fieldState:{isDirty}}) => (
                                <div className="d-flex align-items-center gap-1">
                                    <Form.Control as="select" {...field} className={isDirty ? 'bg-warning-light' : ''} aria-describedby="emailErrorsGroupHelp" disabled={!enabled} >
                                        <option></option>
                                        {groups.map(g=><option value={g.GROUP_ID} key={g.GROUP_ID}>{g.GROUP_NAME}</option>)}
                                    </Form.Control>
                                    <ResetButton field="forms.email.errorsGroup" isDirty={isDirty} tooltip="Reset Errors Group"/>
                                </div>
                            )}
                        />
                        <Form.Text id="emailErrorsGroupHelp" className="pt-1" muted>Group notified when errors are encountered in the Form process</Form.Text>
                    </Col>
                </Form.Group>
            </section>
           {enabled && <SettingsFormsEmailStatus/>}
           <SettingsSimulateEmail type="form"/>
        </>
    );
}

function SettingsFormsEmailStatus() {
    const { control, setValue, formState: { isDirty , dirtyFields} } = useFormContext();
    const { forms } = useSettingsContext();

    const handleMailChange = (e,field) => {
        const value = new Set(field.value);
        if (e.target.checked) {
            value.add(e.target.value);
        } else {
            value.delete(e.target.value);
        }
        setValue(field.name,Array.from(value),{shouldDirty:true});
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
                        <tr key={s} className={isDirty && dirtyFields.forms?.email?.status?.[s] ? 'table-warning' : ''}>
                            <td>
                                {s}
                                {isDirty && dirtyFields.forms?.email?.status?.[s] && <ResetButton field={`forms.email.status.${s}`} isDirty={isDirty} tooltip="Reset Email Status"/>}
                            </td>
                            <td>
                                <Controller
                                    name={`forms.email.status.${s}.subject`}
                                    control={control}
                                    render={({field}) => <Form.Control {...field} type="text" placeholder="Enter Subject"/>}
                                />
                            </td>
                            <td>{mailOptions['to'].map(o=>(
                                <Controller
                                    key={`mailto_${o[0]}`}
                                    name={`forms.email.status.${s}.mailto`}
                                    control={control}
                                    render={({field}) => <Form.Check {...field} type="checkbox" label={o[1]} checked={field.value.includes(o[0])} onChange={e=>handleMailChange(e,field)} value={o[0]}/>}
                                />
                            ))}</td>
                            <td>{mailOptions['cc'].map(o=>(
                                <Controller
                                    key={`mailcc_${o[0]}`}
                                    name={`forms.email.status.${s}.mailcc`}
                                    control={control}
                                    render={({field}) => <Form.Check {...field} type="checkbox" label={o[1]} checked={field.value.includes(o[0])} onChange={e=>handleMailChange(e,field)} value={o[0]}/>}
                                />
                            ))}</td>
                            <td>{mailOptions['replyto'].map(o=>(
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
