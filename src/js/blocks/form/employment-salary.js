import React, { useState, useMemo, useCallback, useEffect } from "react";
import { Row, Col, Form, InputGroup, Table } from "react-bootstrap";
import { useFormContext, Controller, useWatch, useFieldArray } from "react-hook-form";
import DatePicker from "react-datepicker";
import SUNYAccount, { SingleSUNYAccount } from "../sunyaccount";
import { AppButton, CurrencyFormat, DateFormat, DepartmentSelector } from "../components";
import { Icon } from "@iconify/react";
import { cloneDeep } from "lodash";
import { useAppQueries } from "../../queries";
import useFormQueries from "../../queries/forms";
import { AsyncTypeahead } from "react-bootstrap-typeahead";

const name = 'employment.salary';
const splitAssignFormTypes = ['EF-PAY-1'];

export default function EmploymentAppointment() {
    const { control, setValue, formState: { errors }, showInTest, testHighlight } = useFormContext();
    const watchAmounts = useWatch({name:[
        `${name}.RATE_AMOUNT`,
        `${name}.NUMBER_OF_PAYMENTS`,
        'employment.position.APPOINTMENT_PERCENT'
    ],control:control});
    const watchPayBasis = useWatch({name:'employment.position.positionDetails.PAY_BASIS',control:control});
    const watchFormType = useWatch({name:['formActions.formCode','formActions.actionCode','formActions.transactionCode'],control:control});
    const rateAmountLabel = useMemo(() => {
        switch(watchPayBasis) {
            case "BIW":
            case "FEE":
                return "Biweekly";
            case "HRY":
                return "Hourly";
            default:
                return "Full-Time";
        }
    },[watchPayBasis]);
    useEffect(() => {
        setValue(`${name}.totalSalary`,((+watchAmounts[0]*+watchAmounts[1]) * (+watchAmounts[2]/100)).toFixed(2));
    },[watchAmounts]);
    useEffect(()=>{
        console.log(watchFormType);
    },[watchFormType]);
    return (
        <article>
            <section className="mt-3">
                <Row as="header">
                    <Col as="h3">Salary</Col>
                </Row>
                <Form.Group as={Row}>
                    <Form.Label column md={2}>Effective Date:</Form.Label>
                    <Col xs="auto">
                        <InputGroup>
                            <Controller
                                name={`${name}.effDate`}
                                control={control}
                                render={({field}) => <Form.Control
                                    as={DatePicker}
                                    name={field.name}
                                    selected={field.value}
                                    closeOnScroll={true}
                                    onChange={field.onChange}
                                    autoComplete="off"
                                />}
                            />
                            <InputGroup.Append>
                                <InputGroup.Text>
                                    <Icon icon="mdi:calendar-blank"/>
                                </InputGroup.Text>
                            </InputGroup.Append>
                        </InputGroup>
                    </Col>
                </Form.Group>
                <Form.Group as={Row}>
                    <Form.Label column md={2}>Pay Basis:</Form.Label>
                    <Col xs="auto" className="pt-2">
                        <p className="mb-0">{watchPayBasis}</p>
                    </Col>
                </Form.Group>
                {(!['HRY','BIW','FEE'].includes(watchPayBasis)||showInTest) && 
                    <Form.Group as={Row} className={testHighlight(!['HRY','BIW','FEE'].includes(watchPayBasis))}>
                        <Form.Label column md={2}>Appointment Percent:</Form.Label>
                        <Col xs="auto" className="pt-2">
                            <p className="mb-0">{watchAmounts[2]}%</p>
                        </Col>
                    </Form.Group>
                }
                {(['BIW','FEE'].includes(watchPayBasis)||showInTest) && 
                    <Form.Group as={Row} className={testHighlight(['BIW','FEE'].includes(watchPayBasis))}>
                        <Form.Label column md={2}># Payments:</Form.Label>
                        <Col xs="auto">
                            <Controller
                                name={`${name}.NUMBER_OF_PAYMENTS`}
                                defaultValue=""
                                control={control}
                                render={({field}) => <Form.Control {...field} type="number" min={1}/>}
                            />
                        </Col>
                    </Form.Group>
                }
                <Form.Group as={Row}>
                    <Form.Label column md={2}>{rateAmountLabel} Rate:</Form.Label>
                    <Col xs="auto">
                        <Controller
                            name={`${name}.RATE_AMOUNT`}
                            defaultValue=""
                            control={control}
                            render={({field}) => <Form.Control {...field} type="text"/>}
                        />
                    </Col>
                </Form.Group>
                <Form.Group as={Row}>
                    <Form.Label column md={2}>Total Salary:</Form.Label>
                    <Col xs="auto" className="pt-2">
                    <Controller
                            name={`${name}.totalSalary`}
                            defaultValue=""
                            control={control}
                            render={({field}) => <p className="mb-0"><CurrencyFormat>{field.value}</CurrencyFormat></p>}
                        />
                    </Col>
                </Form.Group>
                <SUNYAccount name={`${name}.SUNYAccounts`}/>
            </section>
            
            <AdditionalSalary/>

            {watchFormType.join('-')=='TEST--'&&<p>testing</p>}
            <SplitAssignments/>


        </article>
    );
}

function AdditionalSalary() {
    const blockName = `${name}.additionalSalary`;

    const { control, getValues, setValue, setFocus, clearErrors } = useFormContext();
    const { fields, append, remove, update } = useFieldArray({
        control:control,
        name:blockName
    });

    const watchFieldArray = useWatch({name:blockName,control:control});

    const [isNew,setIsNew] = useState(false);
    const [editIndex,setEditIndex] = useState();
    const [editValues,setEditValues] = useState();

    const {getListData} = useAppQueries();
    const types = getListData('additionalSalaryTypes');

    const handleNew = () => {
        append({
            type:{id:"",label:""},
            startDate:"",
            endDate:"",
            account:[],
            payments:"",
            amount:"",
            total: 0,
            created:new Date()
        });
        setEditIndex(fields.length);
        setIsNew(true);
    }
    const handleEdit = index => {
        setEditIndex(index);
        setEditValues(cloneDeep(getValues(`${blockName}.${index}`)));
        setIsNew(false); // can only edit existing
    }
    const handleCancel = index => {
        const checkFields = Object.keys(fields[index]).map(f=>`${blockName}.${index}.${f}`);
        clearErrors(checkFields);
        update(index,editValues);
        setEditValues(undefined);
        setEditIndex(undefined);
    }
    const handleSave = index => {
        /*const checkFields = Object.keys(fields[index]).map(f=>`${name}.${index}.${f}`);
        trigger(checkFields).then(valid => {
            if (!valid) {
                console.log('Errors!',errors);
            } else {
                console.log
                setEditIndex(undefined);
                setEditValues(undefined);
                setIsNew(false);
            }
        }).catch(e=>console.error(e));*/
        setEditIndex(undefined);
        setEditValues(undefined);
        setIsNew(false);
    }
    const handleRemove = index => {
        remove(index);
        setEditIndex(undefined);
        setEditValues(undefined);
        setIsNew(false);
    }

    const handleSelectChange = (e,field) => {
        field.onChange(e);
        const nameBase = field.name.split('.').slice(0,-1).join('.');
        setValue(`${nameBase}.label`,e.target.selectedOptions?.item(0)?.label);
    }

    const calcTotal = useCallback(index=>(!watchFieldArray[index]) ? 0 : (+watchFieldArray[index].payments*+watchFieldArray[index].amount),[watchFieldArray]);

    useEffect(() => {
        if (editIndex == undefined) return;
        document.querySelector(`[name="${blockName}.${editIndex}.type.id"]`).focus();
    },[editIndex]);

    return (
        <section className="mt-4 border-top pt-2">
            <Row as="header">
                <Col as="h3">
                    Additional Salary
                </Col>
            </Row>
            {getValues(`${name}.EXISTING_ADDITIONAL_SALARY`).length>0&&<ExistingAdditionalSalary/>}
            {fields.map((flds,index)=>(
                <section key={flds.id} className="border rounded p-2 mb-2">
                    <Form.Row>
                        <Col xs="auto" className="mb-2">
                            <Form.Label>Type:</Form.Label>
                            <Controller
                                name={`${blockName}.${index}.type.id`}
                                defaultValue=""
                                control={control}
                                render={({field}) => (
                                    <Form.Control {...field} as="select" onChange={e=>handleSelectChange(e,field)} disabled={editIndex!=index}>
                                        <option></option>
                                        {types.data && types.data.map(t=><option key={t[0]} value={t[0]}>{t[1]}</option>)}
                                    </Form.Control>
                                )}
                            />
                        </Col>
                        <Col xs="auto" className="mb-2">
                            <Form.Label>Start Date:</Form.Label>
                            <InputGroup>
                                <Controller
                                    name={`${blockName}.${index}.startDate`}
                                    control={control}
                                    render={({field}) => <Form.Control 
                                        as={DatePicker} 
                                        name={field.name}
                                        selected={field.value} 
                                        closeOnScroll={true} 
                                        onChange={field.onChange}
                                        autoComplete="off"
                                        disabled={editIndex!=index}
                                        maxDate={()=>{
                                            console.log(watchFieldArray);
                                            return new Date();
                                        }}
                                    />}
                                />
                                <InputGroup.Append>
                                    <InputGroup.Text>
                                        <Icon icon="mdi:calendar-blank"/>
                                    </InputGroup.Text>
                                </InputGroup.Append>
                            </InputGroup>
                        </Col>
                        <Col xs="auto" className="mb-2">
                            <Form.Label>End Date:</Form.Label>
                            <InputGroup>
                                <Controller
                                    name={`${blockName}.${index}.endDate`}
                                    control={control}
                                    render={({field}) => <Form.Control 
                                        as={DatePicker} 
                                        name={field.name}
                                        selected={field.value} 
                                        closeOnScroll={true} 
                                        onChange={field.onChange}
                                        autoComplete="off"
                                        disabled={editIndex!=index}
                                    />}
                                />
                                <InputGroup.Append>
                                    <InputGroup.Text>
                                        <Icon icon="mdi:calendar-blank"/>
                                    </InputGroup.Text>
                                </InputGroup.Append>
                            </InputGroup>
                        </Col>
                        <Col xs={6} md={4} className="mb-2">
                            <Form.Label>Account:</Form.Label>
                            <SingleSUNYAccount name={`${blockName}.${index}.account`} disabled={editIndex!=index}/>
                        </Col>
                        <Col xs={2} md={1} className="mb-2">
                            <Form.Label>Pmts:</Form.Label>
                            <Controller
                                name={`${blockName}.${index}.payments`}
                                defaultValue=""
                                control={control}
                                render={({field}) => <Form.Control {...field} type="number" disabled={editIndex!=index}/>}
                            />
                        </Col>
                        <Col xs={4} sm={3} md={2} className="mb-2">
                            <Form.Label>Amount:</Form.Label>
                            <Controller
                                name={`${blockName}.${index}.amount`}
                                defaultValue=""
                                control={control}
                                render={({field}) => <Form.Control {...field} type="number" disabled={editIndex!=index}/>}
                            />
                        </Col>
                        <Col xs={4} sm={3} md={2} className="mb-2">
                            <Form.Label>Total:</Form.Label>
                            <p className="mb-0 py-2">
                                <CurrencyFormat>{calcTotal(index)}</CurrencyFormat>
                            </p>
                        </Col>
                    </Form.Row>
                    <Row>
                        <Col className="button-group-sm">
                            {editIndex!=index && <AppButton format="edit" className="mr-1" size="sm" onClick={()=>handleEdit(index)} disabled={editIndex!=undefined&&editIndex!=index}>Edit</AppButton>}
                            {editIndex==index && <AppButton format="save" className="mr-1" size="sm" onClick={()=>handleSave(index)} disabled={editIndex!=undefined&&editIndex!=index}>Save</AppButton>}
                            {(editIndex==index&&!isNew) && <AppButton format="cancel" className="mr-1" size="sm" onClick={()=>handleCancel(index)} variant="secondary" disabled={editIndex!=undefined&&editIndex!=index}>Cancel</AppButton>}
                            <AppButton format="delete" className="mr-1" size="sm" onClick={()=>handleRemove(index)} disabled={editIndex!=undefined&&editIndex!=index}>Remove</AppButton>
                        </Col>
                    </Row>
                    <Row>
                        <Col>
                            <small><span className="fw-bold">Created: </span><DateFormat>{flds.created}</DateFormat></small>
                        </Col>
                        <Col className="text-right">
                            <small>{index}:{flds.id}</small>
                        </Col>
                    </Row>
                </section>
            ))}
            <Row>
                <Col><AppButton format="add" size="sm" onClick={handleNew} disabled={editIndex!=undefined}>Add Salary</AppButton></Col>
            </Row>
        </section>
    );
}

function ExistingAdditionalSalary() {
    const blockName = `${name}.EXISTING_ADDITIONAL_SALARY`;

    const { getValues } = useFormContext();

    return(
        <Row>
            <Col>
                <Table striped bordered size="sm" responsive>
                    <thead>
                        <tr>
                            <th scope="col">Type</th>
                            <th scope="col">Start Date</th>
                            <th scope="col">End Date</th>
                            <th scope="col">Amount</th>
                        </tr>
                    </thead>
                    <tbody>
                        {getValues(`${blockName}`).map(row => (
                            <tr key={row.HR_ADDITIONAL_SALARY_ID}>
                                <td>{row.ADDL_SALARY_EARNING_CODE?.label}</td>
                                <td><DateFormat>{row.ADDL_SALARY_EFFECTIVE_DATE}</DateFormat></td>
                                <td><DateFormat>{row.ADDL_SALARY_END_DATE}</DateFormat></td>
                                <td><CurrencyFormat>{row.ADDL_SALARY_AMOUNT}</CurrencyFormat></td>
                            </tr>
                        ))}
                    </tbody>
                </Table>
            </Col>
        </Row>
    );
}

function SplitAssignments() {
    const blockName = `${name}.SPLIT_ASSIGNMENTS`;

    const { control, getValues, setValue, clearErrors } = useFormContext();
    const { fields, append, remove, update } = useFieldArray({
        control:control,
        name:blockName
    });

    const watchFieldArray = useWatch({name:blockName,control:control});

    const [isNew,setIsNew] = useState(false);
    const [editIndex,setEditIndex] = useState();
    const [editValues,setEditValues] = useState();
    const [searchFilter,setSearchFilter] = useState('');
    const [changePrimary,setChangePrimary] = useState(false);

    const {getListData} = useAppQueries();
    const workAllocation = getListData('workAllocation');
    const { getSupervisorNames } = useFormQueries();
    const supervisors = getSupervisorNames(searchFilter,{enabled:false});

    const handleNew = () => {
        append({      
            "HR_COMMITMENT_ID": "",
            "COMMITMENT_PRIMARY_FLAG": "N",
            "COMMITMENT_STACK_ID": "",
            "COMMITMENT_EFFECTIVE_DATE": "",
            "COMMITMENT_END_DATE": "",
            "CAMPUS_TITLE": "",
            "REPORTING_DEPARTMENT_CODE": {"id": "","label": ""},
            "SUPERVISOR_SUNY_ID": "",
            "SUPERVISOR_NAME": "",
            "WORK_ALLOCATION": {"id":"","label":""},
            "WORK_PERCENT": "100",
            "DUTIES": "",
            "supervisor": [],
            "createDate":new Date()
        });
        setEditIndex(fields.length);
        setIsNew(true);
    }
    const handleEdit = index => {
        setEditIndex(index);
        setEditValues(cloneDeep(getValues(`${blockName}.${index}`)));
        setIsNew(false); // can only edit existing
    }
    const handleCancel = index => {
        const checkFields = Object.keys(fields[index]).map(f=>`${blockName}.${index}.${f}`);
        clearErrors(checkFields);
        update(index,editValues);
        setEditValues(undefined);
        setEditIndex(undefined);
        setChangePrimary(false);
    }
    const handleSave = index => {
        /*const checkFields = Object.keys(fields[index]).map(f=>`${name}.${index}.${f}`);
        trigger(checkFields).then(valid => {
            if (!valid) {
                console.log('Errors!',errors);
            } else {
                console.log
                setEditIndex(undefined);
                setEditValues(undefined);
                setIsNew(false);
            }
        }).catch(e=>console.error(e));*/
        if (changePrimary) {
            watchFieldArray.forEach((a,i) => {
                if (index!=i&&a.COMMITMENT_PRIMARY_FLAG=='Y') {
                    console.warn(`Changing Primary Flag for index ${i} to "No"`);
                    setValue(`${blockName}.${i}.COMMITMENT_PRIMARY_FLAG`,'N');
                }
            });
        }
        setEditIndex(undefined);
        setEditValues(undefined);
        setIsNew(false);
        setChangePrimary(false);
    }
    const handleRemove = index => {
        remove(index);
        setEditIndex(undefined);
        setEditValues(undefined);
        setIsNew(false);
        setChangePrimary(false);
    }

    const handleSelectChange = (e,field) => {
        field.onChange(e);
        const nameBase = field.name.split('.').slice(0,-1).join('.');
        setValue(`${nameBase}.label`,e.target.selectedOptions?.item(0)?.label);
    }

    const handleSearch = query => setSearchFilter(query);
    const handleBlur = (field,e) => {
        field.onBlur(e);
        const baseName = field.name.split('.').slice(0,-1).join('.');
        if (e.target.value != getValues(`${baseName}.0.label`)) {
            setValue(`${baseName}.0`,{id:'new-id-0',label:e.target.value});
        }
    }
    const handlePrimaryChange = (e,field) => {
        if (e.target.checked) {
            // check for other primary; if any then warn.  set others to N on save
            const filter = watchFieldArray.filter((p,i)=>editIndex!=i&&p.COMMITMENT_PRIMARY_FLAG=='Y');
            field.onChange('Y');
            setChangePrimary(filter?.length>0);
        } else {
            field.onChange('N');
            setChangePrimary(false);
        }
    }

    useEffect(() => searchFilter&&supervisors.refetch(),[searchFilter]);
    useEffect(() => {
        if (editIndex == undefined) return;
        //document.querySelector(`[name="${blockName}.${editIndex}.type.id"]`).focus();
    },[editIndex]);

    return (
        <section className="mt-4 border-top pt-2">
            <Row as="header">
                <Col as="h3">
                    Split Assignments
                </Col>
            </Row>
            {fields.map((fld,index)=>(
                <section key={fld.id} className="border rounded p-2 mb-2">
                    {(editIndex==index&&changePrimary)&&<Row>
                        <Col><span className="text-warning">Warning: You are changing the primary flag to this assignment.  Saving will uncheck all other assigments.</span></Col>
                    </Row>}
                    <Form.Row>
                        <Col xs="auto" className="mb-2">
                            <Form.Label>Primary:</Form.Label>
                            <Controller
                                name={`${blockName}.${index}.COMMITMENT_PRIMARY_FLAG`}
                                control={control}
                                render={({field}) => <Form.Check {...field} type="checkbox" className="ml-3 mt-1 form-check-input-lg" value="Y" onChange={e=>handlePrimaryChange(e,field)} checked={field.value=="Y"} disabled={editIndex!=index}/>}
                            />
                        </Col>
                        <Col xs="auto" className="mb-2">
                            <Form.Label>Start Date:</Form.Label>
                            <InputGroup>
                                <Controller
                                    name={`${blockName}.${index}.commitmentEffDate`}
                                    control={control}
                                    render={({field}) => <Form.Control 
                                        as={DatePicker} 
                                        name={field.name}
                                        selected={field.value} 
                                        closeOnScroll={true} 
                                        onChange={field.onChange}
                                        autoComplete="off"
                                        disabled={editIndex!=index||fld.HR_COMMITMENT_ID!=""}
                                        maxDate={()=>{
                                            console.log(watchFieldArray);
                                            return new Date();
                                        }}
                                    />}
                                />
                                <InputGroup.Append>
                                    <InputGroup.Text>
                                        <Icon icon="mdi:calendar-blank"/>
                                    </InputGroup.Text>
                                </InputGroup.Append>
                            </InputGroup>
                        </Col>
                        <Col xs="auto" className="mb-2">
                            <Form.Label>End Date:</Form.Label>
                            <InputGroup>
                                <Controller
                                    name={`${blockName}.${index}.commitmentEndDate`}
                                    control={control}
                                    render={({field}) => <Form.Control 
                                        as={DatePicker} 
                                        name={field.name}
                                        selected={field.value} 
                                        closeOnScroll={true} 
                                        onChange={field.onChange}
                                        autoComplete="off"
                                        disabled={editIndex!=index}
                                    />}
                                />
                                <InputGroup.Append>
                                    <InputGroup.Text>
                                        <Icon icon="mdi:calendar-blank"/>
                                    </InputGroup.Text>
                                </InputGroup.Append>
                            </InputGroup>
                        </Col>
                        <Col xs="auto" className="mb-2">
                            <Form.Label>Title:</Form.Label>
                            <Controller
                                name={`${blockName}.${index}.CAMPUS_TITLE`}
                                defaultValue=""
                                control={control}
                                render={({field}) => <Form.Control {...field} type="text" disabled={editIndex!=index||fld.HR_COMMITMENT_ID!=""}/>}
                            />
                        </Col>
                        <Col xs="auto" className="mb-2">
                            <Form.Label>Department:</Form.Label>
                            <Controller
                                name={`${blockName}.${index}.REPORTING_DEPARTMENT_CODE.id`}
                                defaultValue=""
                                control={control}
                                render={({field}) => <DepartmentSelector field={field} onChange={e=>handleSelectChange(e,field)} disabled={editIndex!=index||fld.HR_COMMITMENT_ID!=""}/>}
                            />
                        </Col>
                        <Col xs={12} sm={8} md={6} lg={5} xl={4} className="mb-2">
                            <Form.Label>Supervisor:</Form.Label>
                            <Controller
                                name={`${blockName}.${index}.supervisor`}
                                control={control}
                                render={({field}) => <AsyncTypeahead
                                    {...field}
                                    filterBy={()=>true}
                                    id="supervisor-search"
                                    isLoading={supervisors.isLoading}
                                    minLength={2}
                                    flip={true} 
                                    allowNew={true}
                                    onSearch={handleSearch}
                                    onBlur={e=>handleBlur(field,e)}
                                    options={supervisors.data}
                                    placeholder="Search for supervisor..."
                                    selected={field.value}
                                    disabled={editIndex!=index||fld.HR_COMMITMENT_ID!=""}
                                />}
                            />
                        </Col>
                        <Col xs="auto" className="mb-2">
                            <Form.Label>Allocation:</Form.Label>
                            <Controller
                                name={`${blockName}.${index}.WORK_ALLOCATION.id`}
                                defaultValue=""
                                control={control}
                                render={({field}) => (
                                    <Form.Control {...field} as="select" onChange={e=>handleSelectChange(e,field)} disabled={editIndex!=index||fld.HR_COMMITMENT_ID!=""}>
                                        <option></option>
                                        {workAllocation.data && workAllocation.data.map(a=><option key={a[0]} value={a[0]}>{a[1]}</option>)}
                                    </Form.Control>
                                )}
                            />
                        </Col>
                        <Col xs="auto" className="mb-2">
                            <Form.Label>Work %:</Form.Label>
                            <Controller
                                name={`${blockName}.${index}.WORK_PERCENT`}
                                defaultValue=""
                                control={control}
                                render={({field}) => <Form.Control {...field} type="number" min={1} max={100} disabled={editIndex!=index}/>}
                            />
                        </Col>
                    </Form.Row>
                    <Row>
                        <Col className="button-group-sm">
                            {editIndex!=index && <AppButton format="edit" className="mr-1" size="sm" onClick={()=>handleEdit(index)} disabled={editIndex!=undefined&&editIndex!=index}>Edit</AppButton>}
                            {editIndex==index && <AppButton format="save" className="mr-1" size="sm" onClick={()=>handleSave(index)} disabled={editIndex!=undefined&&editIndex!=index}>Save</AppButton>}
                            {(editIndex==index&&!isNew) && <AppButton format="cancel" className="mr-1" size="sm" onClick={()=>handleCancel(index)} variant="secondary" disabled={editIndex!=undefined&&editIndex!=index}>Cancel</AppButton>}
                            <AppButton format="delete" className="mr-1" size="sm" onClick={()=>handleRemove(index)} disabled={editIndex!=undefined&&editIndex!=index}>Remove</AppButton>
                        </Col>
                    </Row>
                    <Row>
                        <Col>
                            <small><span className="fw-bold">Created: </span><DateFormat>{fld.createDate}</DateFormat></small>
                        </Col>
                        <Col className="text-right">
                            <small>{index}:{fld.id}:{fld.HR_COMMITMENT_ID}</small>
                        </Col>
                    </Row>
                </section>
            ))}
            <Row>
                <Col><AppButton format="add" size="sm" onClick={handleNew} disabled={editIndex!=undefined}>Add Assignment</AppButton></Col>
            </Row>
        </section>
    );
}
