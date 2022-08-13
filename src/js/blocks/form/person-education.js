import React, { useState, useCallback, useMemo, useEffect } from "react";
import { Row, Col, Form } from "react-bootstrap";
import { useFormContext, useFieldArray, Controller, useWatch } from "react-hook-form";
import { useAppQueries } from "../../queries";
import { AppButton } from "../components";
import DatePicker from "react-datepicker";
import { Typeahead } from "react-bootstrap-typeahead";

export default function PersonEducation() {
    const { control } = useFormContext();
    const { fields, append, remove, move, update } = useFieldArray({
        control:control,
        name:'person.education'
    });

    const [editIndex,setEditIndex] = useState();

    const {getListData} = useAppQueries();
    const degreeTypes = getListData('degreeTypes',{select:d=>{
        return d.map(degree=>{return {id:degree.DEGREE_TYPE_CODE,label:`${degree.DEGREE_TYPE_CODE} - ${degree.DEGREE_TYPE_DESC}`}});
    }});
    const countryCodes = getListData('countryCodes');

    const handleNew = () => {
        if (fields.length > 2) return;
        append({awardDate:"",pending:false,type:[],specialization:"",country:"",state:"",name:"",highest:false,terminal:false,verified:false});
        setEditIndex(fields.length);
    }
    const handleEdit = index => {
        setEditIndex(index);
    }
    const handleSave = index => {
        setEditIndex(undefined);
        console.log(fields[index]);
    }
    const handleRemove = index => {
        remove(index);
    }

    return (
        <article className="mt-3">
            <Row as="header">
                <Col as="h3">Education <AppButton format="add" size="sm" onClick={handleNew} disabled={fields.length>2}>New</AppButton></Col>
            </Row>
            {fields.map((field,index)=>(
                <div key={field.id} className="border rounded p-2 mb-2">
                    <Form.Group as={Row} className="mb-1">
                        <Form.Label column md={3}>Degree Award Date:</Form.Label>
                        <Col xs="auto">
                            <Controller
                                name={`person.education.${index}.awardDate`}
                                defaultValue=""
                                control={control}
                                render={({field}) => <Form.Control 
                                    as={DatePicker} 
                                    name={field.name}
                                    closeOnScroll={true} 
                                    selected={field.value} 
                                    onChange={field.onChange}
                                    disabled={editIndex!=index}
                                />}
                            />
                        </Col>
                        <Col className="pt-2">
                            <Controller
                                name={`person.education.${index}.pending`}
                                defaultValue=""
                                control={control}
                                render={({field}) => <Form.Check {...field} label="Pending Degree" checked={field.value} disabled={editIndex!=index}/>}
                            />
                        </Col>
                    </Form.Group>
                    <Form.Group as={Row} className="mb-1">
                        <Form.Label column md={3}>Degree Type:</Form.Label>
                        <Col xs={12} md={8}>
                            {degreeTypes.isLoading && <p>Loading...</p>}
                            {degreeTypes.isError && <p>Error Loading</p>}
                            {degreeTypes.data &&
                                <Controller
                                    name={`person.education.${index}.type`}
                                    defaultValue=""
                                    control={control}
                                    render={({field}) => <Typeahead 
                                        {...field} 
                                        id={`degreeType-${index}`}
                                        options={degreeTypes.data} 
                                        flip={true} 
                                        minLength={2} 
                                        allowNew={true} 
                                        selected={field.value}
                                        disabled={editIndex!=index}
                                    />}
                                />
                            }
                        </Col>
                    </Form.Group>
                    <Form.Group as={Row} className="mb-1">
                        <Form.Label column md={3}>Degree Specialization:</Form.Label>
                        <Col xs={12} md={8}>
                            <Controller
                                name={`person.education.${index}.specialization`}
                                defaultValue=""
                                control={control}
                                render={({field}) => <Form.Control {...field} disabled={editIndex!=index}/>}
                            />
                        </Col>
                    </Form.Group>
                    <Form.Group as={Row} className="mb-1">
                        <Form.Label column md={3}>University/College Country:</Form.Label>
                        <Col xs="auto">
                            <Controller
                                name={`person.education.${index}.country`}
                                defaultValue=""
                                control={control}
                                render={({field}) => (
                                    <Form.Control {...field} as="select" disabled={editIndex!=index}>
                                        <option></option>
                                        {countryCodes.data&&countryCodes.data.map(c=><option key={c.COUNTRY_CODE} value={c.COUNTRY_CODE}>{c.COUNTRY_SHORT_DESC}</option>)}
                                    </Form.Control>
                                )}
                            />
                        </Col>
                    </Form.Group>
                    <Row>
                        <Col className="button-group-sm">
                            {editIndex!=index && <AppButton format="edit" className="mr-1" size="sm" onClick={()=>handleEdit(index)}>Edit</AppButton>}
                            {editIndex==index && <AppButton format="save" className="mr-1" size="sm" onClick={()=>handleSave(index)}>Save</AppButton>}
                            <AppButton format="delete" className="mr-1" size="sm" onClick={()=>handleRemove(index)}>Remove</AppButton>
                        </Col>
                    </Row>
                    <Row>
                        <Col>
                            <small><span className="fw-bold">Created: </span>mm/dd/yyyy</small>
                        </Col>
                        <Col className="text-right">
                            <small>{index}:{field.id}</small>
                        </Col>
                    </Row>
                </div>
            ))}
        </article>
    );
}
