import React, { useState, useMemo, useCallback } from "react";
import { Row, Col, Form, InputGroup } from "react-bootstrap";
import { useFormContext, Controller, useWatch, useFieldArray } from "react-hook-form";
import DatePicker from "react-datepicker";
import SUNYAccount, { SingleSUNYAccount } from "../sunyaccount";
import { AppButton, CurrencyFormat, DateFormat } from "../components";
import { Icon } from "@iconify/react";
import { cloneDeep } from "lodash";
import { useAppQueries } from "../../queries";

const name = 'employment.salary';

export default function EmploymentAppointment() {
    const { control, getValues, setValue, formState: { errors }, showInTest, testHighlight } = useFormContext();
    const watchRateAmount = useWatch({name:`${name}.RateAmount`,control:control,defaultValue:0});
    const watchPayBasis = useWatch({name:'employment.position.positionDetails.PAY_BASIS',control:control});
    const watchApptPercent = useWatch({name:'employment.position.APPOINTMENT_PERCENT',control:control,defaultValue:100});
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
    const calcTotalSalary = useMemo(() => {
        return (+watchRateAmount * (+watchApptPercent/100)).toFixed(2);
    },[watchApptPercent,watchRateAmount]);
    return (
        <article>
            <section className="mt-3">
                <Row as="header">
                    <Col as="h3">Salary</Col>
                </Row>
                <Form.Group as={Row}>
                    <Form.Label column md={2}>Salary Effective Date:</Form.Label>
                    <Col xs="auto">
                        <InputGroup>
                            <Controller
                                name="effDate"
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
                            <p className="mb-0">{watchApptPercent}%</p>
                        </Col>
                    </Form.Group>
                }
                {(['BIW','FEE'].includes(watchPayBasis)||showInTest) && 
                    <Form.Group as={Row} className={testHighlight(['BIW','FEE'].includes(watchPayBasis))}>
                        <Form.Label column md={2}># Payments:</Form.Label>
                        <Col xs="auto">
                            <Controller
                                name={`${name}.numPayments`}
                                defaultValue=""
                                control={control}
                                render={({field}) => <Form.Control {...field} type="text"/>}
                            />
                        </Col>
                    </Form.Group>
                }
                <Form.Group as={Row}>
                    <Form.Label column md={2}>{rateAmountLabel} Rate:</Form.Label>
                    <Col xs="auto">
                        <Controller
                            name={`${name}.RateAmount`}
                            defaultValue=""
                            control={control}
                            render={({field}) => <Form.Control {...field} type="text"/>}
                        />
                    </Col>
                </Form.Group>
                <Form.Group as={Row}>
                    <Form.Label column md={2}>Total Salary:</Form.Label>
                    <Col xs="auto" className="pt-2">
                        <p className="mb-0"><CurrencyFormat>{calcTotalSalary}</CurrencyFormat></p>
                    </Col>
                </Form.Group>
                <SUNYAccount name={`${name}.SUNYAccounts`}/>
            </section>
            
            <AdditionalSalary/>

        </article>
    );
}
function AdditionalSalary() {
    const blockName = `${name}.additionalSalary`;

    const { control, getValues, setValue, clearErrors } = useFormContext();
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
            type:"",
            startDate:"",
            endDate:"",
            account:[],
            payments:"",
            amount:"",
            total: 0,
            created:new Date
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

    const calcTotal = useCallback(index=>(!watchFieldArray[index]) ? 0 : (+watchFieldArray[index].payments*+watchFieldArray[index].amount),[watchFieldArray]);

    return (
        <section className="mt-3">
            <Row as="header">
                <Col as="h3">
                    Additional Salary
                </Col>
            </Row>
            {fields.map((flds,index)=>(
                <section key={flds.id} className="border rounded p-2 mb-2">
                    <Form.Row>
                        <Col xs="auto" className="mb-2">
                            <Form.Label>Type:</Form.Label>
                            <Controller
                                name={`${blockName}.${index}.type`}
                                defaultValue=""
                                control={control}
                                render={({field}) => (
                                    <Form.Control {...field} as="select" disabled={editIndex!=index}>
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