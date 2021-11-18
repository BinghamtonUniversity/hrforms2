import React, { useEffect, useState, useMemo } from "react";
import { useAppQueries } from "../../queries";
import { Row, Col, Form, InputGroup, Alert } from "react-bootstrap";
import { Controller, useWatch } from "react-hook-form";
import DatePicker from "react-datepicker";

export default function Position({control,errors,getValues,setValue,posTypes,payBasisTypes,apptTypes}) {
    const [oldLineNum,setOldLineNum] = useState('');

    const posType = useWatch({name:'posType',control:control})||'';
    const isNewLine = useWatch({name:'newLine',control:control});
    const isMultiLine = useWatch({name:'multiLines',control:control});
    const watchFTE = useWatch({name:'fte',control:control})||100;

    const { getListData } = useAppQueries();
    const titles = getListData(posTypes[posType]?.budgetTitlesList,{enabled:false});

    const handleFTERangeChange = e => {
        setValue('fte',e.target.value);
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
    useEffect(() => {
        titles.refetch();
    },[posType]);
    return (
        <article>
            <header>
                <Row>
                    <Col><h3>Position</h3></Col>
                </Row>
            </header>
            <Form.Group as={Row}>
                <Form.Label column md={2}>Line Number:</Form.Label>
                <Col xs="auto">
                    <Controller
                        name="lineNumber"
                        defaultValue=""
                        control={control}
                        render={({field}) => <Form.Control {...field} type="text" placeholder="Enter Line Number" disabled={isNewLine}/>}
                    />
                </Col>
                <Col xs="auto" className="pt-2">
                    <Controller
                        name="newLine"
                        defaultValue={false}
                        control={control}
                        render={({field}) => <Form.Check {...field} type="checkbox" size="lg" label="New Line" checked={field.value}/>}
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
                                <Form.Check {...field} inline type="radio" label="Yes" value='Y' checked={field.value=='Y'}/>
                                <Form.Check {...field} inline type="radio" label="No" value='N' checked={field.value=='N'}/>
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
                    <Form.Label column md={2}>Number Of Lines:</Form.Label>
                    <Col xs="auto">
                        <Controller
                            name="numLines"
                            defaultValue=""
                            control={control}
                            rules={{min:{value:2,message:'Must be at least 2 lines'}}}
                            render={({field}) => <Form.Control {...field} type="number" min={2} isInvalid={errors.numLines}/>}
                        />
                    </Col>
                    <Form.Control.Feedback type="invalid">{errors.numLines?.message}</Form.Control.Feedback>
                </Form.Group>
            </aside>
            }
            <Form.Group as={Row}>
                <Form.Label column md={2}>Requested Salary:</Form.Label>
                <Col xs="auto">
                    <Controller
                        name="minSalary"
                        defaultValue=""
                        control={control}
                        render={({field}) => <Form.Control {...field} type="text"/>}
                    />
                </Col>
                <Col xs="auto">
                    <Controller
                        name="maxSalary"
                        defaultValue=""
                        control={control}
                        render={({field}) => <Form.Control {...field} type="text"/>}
                    />
                </Col>
            </Form.Group>
            <Form.Group as={Row}>
                <Form.Label column md={2}>FTE:</Form.Label>
                <Col xs="auto">
                    <Controller
                        name="fte"
                        defaultValue="100"
                        control={control}
                        rules={{min:{value:1,message:'FTE cannot be less than 1%'},max:{value:100,message:'FTE cannot be greater than 100%'}}}
                        render={({field}) => <Form.Control {...field} type="number" min={1} max={100} isInvalid={errors.fte}/>}
                    />
                    <Form.Control.Feedback type="invalid">{errors.fte?.message}</Form.Control.Feedback>
                </Col>
                <Col sm={8} md={6} className="pt-2">
                    <Form.Control type="range" name="fteRange" id="fteRange" min={1} max={100} value={watchFTE} onChange={handleFTERangeChange}/>
                </Col>
            </Form.Group>
            <Form.Group as={Row}>
                <Form.Label column md={2}>Pay Basis:</Form.Label>
                <Col xs="auto">
                    <Controller
                        name="payBasis"
                        defaultValue=""
                        control={control}
                        render={({field}) => (
                            <Form.Control {...field} as="select">
                                <option></option>
                                {payBasisTypes.map(p=><option key={p[0]} value={p[0]}>{p[0]} - {p[1]}</option>)}
                            </Form.Control>
                        )}
                    />
                </Col>
            </Form.Group>
            {(posType=='C') && 
            <>
                <Form.Group as={Row}>
                    <Form.Label column md={2}>Current Salary Grade:</Form.Label>
                    <Col xs="auto">
                        <Controller
                            name="currentGrade"
                            control={control}
                            render={({field}) => (
                                <InputGroup>
                                    <InputGroup.Prepend>
                                        <InputGroup.Text>SG-</InputGroup.Text>
                                    </InputGroup.Prepend>
                                    <Form.Control {...field} type="text" placeholder="Enter Current Salary Grade"/>
                                </InputGroup>
                            )}
                        />
                    </Col>
                </Form.Group>
                <Form.Group as={Row}>
                    <Form.Label column md={2}>New Salary Grade:</Form.Label>
                    <Col xs="auto">
                        <Controller
                            name="newGrade"
                            control={control}
                            render={({field}) => (
                                <InputGroup>
                                    <InputGroup.Prepend>
                                        <InputGroup.Text>SG-</InputGroup.Text>
                                    </InputGroup.Prepend>
                                    <Form.Control {...field} type="text" placeholder="Enter New Salary Grade"/>
                                </InputGroup>
                            )}
                        />
                    </Col>
                </Form.Group>
            </>
            }
            <Form.Group as={Row}>
                <Form.Label column md={2}>Requested Budget Title:</Form.Label>
                <Col xs="auto">
                    <Controller
                        name="reqBudgetTitle"
                        control={control}
                        render={({field}) => (
                            <Form.Control {...field} as="select">
                                <option></option>
                                {titles.data && titles.data.map(t=><option key={t[0]} value={t[0]}>{t[1]}</option>)}
                            </Form.Control>
                        )}
                    />
                </Col>
            </Form.Group>
            <Form.Group as={Row}>
                <Form.Label column md={2}>Appointment Status:</Form.Label>
                <Col xs="auto">
                    <Controller
                        name="apptStatus"
                        control={control}
                        render={({field}) => (
                            <Form.Control {...field} as="select">
                                <option></option>
                                {apptTypes.map(t=><option key={t[0]} value={t[0]}>{t[1]}</option>)}
                            </Form.Control>
                        )}
                    />
                </Col>
            </Form.Group>
            <Form.Group as={Row}>
                <Form.Label column md={2}>Appointment Duration:</Form.Label>
                <Col xs="auto">
                    <Controller
                        name="apptDuration"
                        defaultValue=""
                        rules={{min:{value:1,message:'Appointment Duration must be at least 1'}}}
                        control={control}
                        render={({field}) => <Form.Control {...field} type="number" min={1} isInvalid={errors.apptDuration}/>}
                    />
                    <Form.Control.Feedback type="invalid">{errors.apptDuration?.message}</Form.Control.Feedback>
                </Col>
                <Col xs="auto" className="pt-2">
                    <Controller
                        name="apptPeriod"
                        defaultValue="y"
                        control={control}
                        render={({field}) => (
                            <>
                                <Form.Check {...field} inline type="radio" label="Year(s)" value='y' checked={field.value=='y'}/>
                                <Form.Check {...field} inline type="radio" label="Semester(s)" value='s' checked={field.value=='s'}/>
                                <Form.Check {...field} inline type="radio" label="Month(s)" value='m' checked={field.value=='m'}/>
                                <Form.Check {...field} inline type="radio" label="Week(s)" value='w' checked={field.value=='w'}/>
                            </>
                        )}
                    />
                </Col>
            </Form.Group>
            <Form.Group as={Row}>
                <Form.Label column md={2}>Tentative End Date:</Form.Label>
                <Col xs="auto">
                    <Controller
                        name="tentativeEndDate"
                        defaultValue=""
                        control={control}
                        render={({field}) => <Form.Control {...field} as={DatePicker} selected={field.value}/>}
                    />
                </Col>
            </Form.Group>
        </article>
    );
}
