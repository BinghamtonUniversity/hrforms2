import React, { useEffect, useState } from "react";
import { Row, Col, Form, InputGroup, Alert } from "react-bootstrap";
import { Controller, useWatch, useFormContext } from "react-hook-form";
import DatePicker from "react-datepicker";
import { Icon } from "@iconify/react";
import { useRequestContext } from "../../config/request";
import useListsQueries from "../../queries/lists";
import { get } from "lodash";
import { RequestFieldErrorMessage } from "../../pages/request";

export default function Position() {
    const { control, getValues, setValue, formState:{ errors }} = useFormContext();
    const { posTypes, canEdit } = useRequestContext();
    const [oldLineNum,setOldLineNum] = useState(getValues('lineNumber'));

    const posType = useWatch({name:'posType.id',control:control})||'';
    const isNewLine = useWatch({name:'newLine',control:control});
    const isMultiLine = useWatch({name:'multiLines',control:control});
    const watchFTE = useWatch({name:'fte',control:control})||100;

    const { getListData } = useListsQueries();
    const paybasistypes = getListData('payBasisTypes',{enabled:!!posType,
        select:d=>d.filter(p=>posTypes[posType]?.payBasisTypes.includes(p[0]))});
    const titles = getListData(posTypes[posType]?.budgetTitlesList,{enabled:!!posType});
    const appttypes = getListData('appointmentTypes',{enabled:!!posType,
        select:d=>d.filter(a=>posTypes[posType]?.apptTypes.includes(a[0])).sort()});

    const handleFTEBlur = e => {
        let v = parseInt(e.target.value);
        if (isNaN(v) || v<1) v=1;
        if (v>100) v=100;
        setValue('fte',v.toString());
    }

    const handleFTERangeChange = e => {
        setValue('fte',e.target.value);
    }
    const handlePayBasisChange = (field,e) => {
        field.onChange(e);
        const pb = paybasistypes.data.find(a=>a[0]==e.target.value);
        setValue('payBasis.title',(pb)?pb[1]:'');
    }
    const handleReqBudgetTitleChange = (field,e) => {
        field.onChange(e);
        const t = titles.data.find(a=>a[0]==e.target.value);
        setValue('reqBudgetTitle.title',(t)?t[1]:'');
    }
    const handleApptStatusChange = (field,e) => {
        field.onChange(e);
        const a = appttypes.data.find(a=>a[0]==e.target.value);
        setValue('apptStatus.title',(a)?a[1]:'');
    }

    useEffect(() => {
        if (isNewLine) {
            const linenum = getValues('lineNumber');
            setOldLineNum(linenum);
            setValue('lineNumber','');
        } else {
            setValue('lineNumber',oldLineNum);
        }
    },[isNewLine]);
    return (
        <>
            <Form.Group as={Row}>
                <Form.Label column md={2}>Line Number*:</Form.Label>
                <Col xs="auto">
                    <Controller
                        name="lineNumber"
                        defaultValue=""
                        control={control}
                        rules={{
                            validate: v => {
                                const isNewLine = getValues('newLine');
                                return (!isNewLine&&v=='')?'Line Number is required':true;
                            }
                        }}
                        render={({field}) => <Form.Control {...field} type="text" placeholder="Enter Line Number" isInvalid={!!get(errors,field.name,false)} disabled={isNewLine||!canEdit}/>}
                    />
                    <RequestFieldErrorMessage fieldName="lineNumber"/>
                </Col>
                <Col xs="auto" className="pt-2">
                    <Controller
                        name="newLine"
                        defaultValue={false}
                        control={control}
                        render={({field}) => <Form.Check {...field} type="checkbox" size="lg" label="New Line" checked={field.value} disabled={!canEdit}/>}
                    />                    
                </Col>
            </Form.Group>
            <Form.Group as={Row}>
                <Form.Label column md={2}>Multiple Duplicate Lines:</Form.Label>
                <Col xs="auto">
                    <Controller
                        name="multiLines"
                        defaultValue="N"
                        control={control}
                        render={({field}) => (
                            <>
                                <Form.Check {...field} inline type="radio" label="Yes" value='Y' checked={field.value=='Y'} disabled={!canEdit}/>
                                <Form.Check {...field} inline type="radio" label="No" value='N' checked={field.value=='N'} disabled={!canEdit}/>
                            </>
                        )}
                    />
                </Col>
            </Form.Group>
            {(isMultiLine=='Y') && 
            <aside>
                <Row>
                    <Col>
                        <Alert variant="warning">All lines <strong>must</strong> have the same Title, Pay Basis, FTE, Account, and Effective Date</Alert>
                    </Col>
                </Row>
                <Form.Group as={Row}>
                    <Form.Label column md={2}>Number Of Lines*:</Form.Label>
                    <Col xs="auto">
                        <Controller
                            name="numLines"
                            defaultValue=""
                            control={control}
                            rules={{
                                required:{value:true,message:'Number of Lines is required'},
                                min:{value:2,message:'Number of Lines must be at least 2'}
                            }}
                            render={({field}) => <Form.Control {...field} type="number" min={2} isInvalid={!!get(errors,field.name,false)} disabled={!canEdit}/>}
                        />
                        <RequestFieldErrorMessage fieldName="numLines"/>
                    </Col>
                </Form.Group>
            </aside>
            }
            <Form.Group as={Row}>
                <Form.Label column md={2}>Requested Salary*:</Form.Label>
                <Col xs="auto">
                    <Controller
                        name="minSalary"
                        defaultValue=""
                        rules={{
                            required:{value:true,message:'Minimum Requested Salary is required'},
                            validate: v => {
                                if (v == '') return true;
                                const min = parseFloat(v)
                                if (min<=0) return 'minSalary must be greater than zero';
                                const max = getValues('maxSalary');
                                if (max == '') return true;
                                if (min > parseFloat(max)) return 'minSalary must be less than maxSalary';
                                return true;
                            },
                            deps:['maxSalary']
                        }}
                        control={control}
                        render={({field}) => <Form.Control {...field} type="number" isInvalid={!!get(errors,field.name,false)} disabled={!canEdit}/>}
                    />
                    <RequestFieldErrorMessage fieldName="minSalary"/>
                </Col>
                <Col xs="auto">
                    <Controller
                        name="maxSalary"
                        defaultValue=""
                        rules={{
                            required:{value:true,message:'Maximum Requested Salary is required'},
                            validate: v => {
                                if (v == '') return true;
                                const max = parseFloat(v)
                                if (max<=0) return 'maxSalary must be greater than zero';
                                const min = getValues('minSalary');
                                if (min == '') return true;
                                if (max < parseFloat(min)) return 'maxSalary must be greater than minSalary';
                                return true;
                            },
                            deps:['minSalary']
                        }}
                        control={control}
                        render={({field}) => <Form.Control {...field} type="number" isInvalid={!!get(errors,field.name,false)} disabled={!canEdit}/>}
                    />
                    <RequestFieldErrorMessage fieldName="maxSalary"/>
                </Col>
            </Form.Group>
            <Form.Group as={Row}>
                <Form.Label column md={2}>FTE*:</Form.Label>
                <Col xs="auto">
                    <Controller
                        name="fte"
                        defaultValue="100"
                        control={control}
                        rules={{min:{value:1,message:'FTE cannot be less than 1%'},max:{value:100,message:'FTE cannot be greater than 100%'}}}
                        render={({field}) => <Form.Control {...field} type="number" min={1} max={100} onBlur={handleFTEBlur} isInvalid={!!get(errors,field.name,false)} disabled={!canEdit}/>}
                    />
                    <RequestFieldErrorMessage fieldName="fte"/>
                </Col>
                <Col sm={8} md={6} className="pt-2">
                    <Form.Control type="range" name="fteRange" id="fteRange" min={1} max={100} value={watchFTE} onChange={handleFTERangeChange} disabled={!canEdit} list="markers"/>
                    <datalist id="markers" className="marker">
                        <option value="0">0%</option>
                        <option value="25">25%</option>
                        <option value="50">50%</option>
                        <option value="75">75%</option>
                        <option value="100">100%</option>
                    </datalist>
                </Col>
            </Form.Group>
            <Form.Group as={Row}>
                <Form.Label column md={2}>Pay Basis*:</Form.Label>
                <Col xs="auto">
                    <Controller
                        name="payBasis.id"
                        defaultValue=""
                        control={control}
                        rules={{required:{value:true,message:'Pay Basis is required'}}}
                        render={({field}) => (
                            <Form.Control {...field} as="select" onChange={e=>handlePayBasisChange(field,e)} isInvalid={!!get(errors,field.name,false)} disabled={!canEdit}>
                                <option></option>
                                {paybasistypes.data && paybasistypes.data.map(p=><option key={p[0]} value={p[0]}>{p[0]} - {p[1]}</option>)}
                            </Form.Control>
                        )}
                    />
                    <RequestFieldErrorMessage fieldName="payBasis.id"/>
                </Col>
            </Form.Group>
            {(posType=='C') && 
            <>
                <Form.Group as={Row}>
                    <Form.Label column md={2}>Current Salary Grade*:</Form.Label>
                    <Col xs="auto">
                        <Controller
                            name="currentGrade"
                            defaultValue=""
                            control={control}
                            rules={{required:{value:true,message:'Current Grade is required'}}}
                            render={({field}) => (
                                <InputGroup>
                                    <InputGroup.Prepend>
                                        <InputGroup.Text>SG-</InputGroup.Text>
                                    </InputGroup.Prepend>
                                    <Form.Control {...field} type="text" placeholder="Enter Current Salary Grade" isInvalid={!!get(errors,field.name,false)} disabled={!canEdit}/>
                                </InputGroup>
                            )}
                        />
                        <RequestFieldErrorMessage fieldName="currentGrade"/>
                    </Col>
                </Form.Group>
                <Form.Group as={Row}>
                    <Form.Label column md={2}>New Salary Grade*:</Form.Label>
                    <Col xs="auto">
                        <Controller
                            name="newGrade"
                            defaultValue=""
                            control={control}
                            rules={{required:{value:true,message:'New Grade is required'}}}
                            render={({field}) => (
                                <InputGroup>
                                    <InputGroup.Prepend>
                                        <InputGroup.Text>SG-</InputGroup.Text>
                                    </InputGroup.Prepend>
                                    <Form.Control {...field} type="text" placeholder="Enter New Salary Grade" isInvalid={!!get(errors,field.name,false)} disabled={!canEdit}/>
                                </InputGroup>
                            )}
                        />
                        <RequestFieldErrorMessage fieldName="newGrade"/>
                    </Col>
                </Form.Group>
            </>
            }
            <Form.Group as={Row}>
                <Form.Label column md={2}>Requested Budget Title*:</Form.Label>
                <Col xs="auto">
                    <Controller
                        name="reqBudgetTitle.id"
                        defaultValue=""
                        control={control}
                        rules={{required:{value:true,message:'Requested Budget Title is required'}}}
                        render={({field}) => (
                            <Form.Control {...field} as="select" onChange={e=>handleReqBudgetTitleChange(field,e)} isInvalid={!!get(errors,field.name,false)} disabled={!canEdit}>
                                <option></option>
                                {titles.data && titles.data.map(t=><option key={t[0]} value={t[0]}>{t[1]}</option>)}
                            </Form.Control>
                        )}
                    />
                    <RequestFieldErrorMessage fieldName="reqBudgetTitle.id"/>
                </Col>
            </Form.Group>
            <Form.Group as={Row}>
                <Form.Label column md={2}>Appointment Status*:</Form.Label>
                <Col xs="auto">
                    <Controller
                        name="apptStatus.id"
                        defaultValue=""
                        control={control}
                        rules={{required:{value:true,message:'Appointment Status is required'}}}
                        render={({field}) => (
                            <Form.Control {...field} as="select" onChange={e=>handleApptStatusChange(field,e)} isInvalid={!!get(errors,field.name,false)} disabled={!canEdit}>
                                <option></option>
                                {appttypes.data && appttypes.data.map(t=><option key={t[0]} value={t[0]}>{t[1]}</option>)}
                            </Form.Control>
                        )}
                    />
                    <RequestFieldErrorMessage fieldName="apptStatus.id"/>
                </Col>
            </Form.Group>
            <Form.Group as={Row}>
                <Form.Label column md={2}>Appointment Duration*:</Form.Label>
                <Col xs="auto">
                    <Controller
                        name="apptDuration"
                        defaultValue=""
                        rules={{
                            min:{value:1,message:'Appointment Duration must greater than zero'},
                            required:{value:true,message:'Appointment Duration is required'}
                        }}
                        control={control}
                        render={({field}) => <Form.Control {...field} type="number" min={1} isInvalid={!!get(errors,field.name,false)} disabled={!canEdit}/>}
                    />
                    <RequestFieldErrorMessage fieldName="apptDuration"/>
                </Col>
                <Col xs="auto" className="pt-2">
                    <Controller
                        name="apptPeriod"
                        defaultValue="y"
                        control={control}
                        render={({field}) => (
                            <>
                                <Form.Check {...field} inline type="radio" label="Year(s)" value='y' checked={field.value=='y'} disabled={!canEdit}/>
                                <Form.Check {...field} inline type="radio" label="Semester(s)" value='s' checked={field.value=='s'} disabled={!canEdit}/>
                                <Form.Check {...field} inline type="radio" label="Month(s)" value='m' checked={field.value=='m'} disabled={!canEdit}/>
                                <Form.Check {...field} inline type="radio" label="Week(s)" value='w' checked={field.value=='w'} disabled={!canEdit}/>
                            </>
                        )}
                    />
                </Col>
            </Form.Group>
            <Form.Group as={Row}>
                <Form.Label column md={2}>Tentative End Date*:</Form.Label>
                <Col xs="auto">
                    <InputGroup>
                        <Controller
                            name="tentativeEndDate"
                            defaultValue=""
                            control={control}
                            rules={{required:{value:true,message:'Tentative End Date is required'}}}
                            render={({field}) => <Form.Control {...field} as={DatePicker} selected={field.value} isInvalid={!!get(errors,field.name,false)} disabled={!canEdit} autoComplete="off"/>}
                        />
                        <InputGroup.Append>
                            <InputGroup.Text>
                                <Icon icon="mdi:calendar-blank"/>
                            </InputGroup.Text>
                        </InputGroup.Append>
                    </InputGroup>
                    <RequestFieldErrorMessage fieldName="tentativeEndDate"/>
                </Col>
            </Form.Group>
        </>
    );
}
