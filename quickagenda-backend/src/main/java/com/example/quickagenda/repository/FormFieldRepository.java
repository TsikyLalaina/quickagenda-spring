package com.example.quickagenda.repository;

import com.example.quickagenda.entity.Form;
import com.example.quickagenda.entity.FormField;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface FormFieldRepository extends JpaRepository<FormField, Long> {
    List<FormField> findByFormOrderByOrderIndexAsc(Form form);
    void deleteByForm(Form form);
}
