package com.example.quickagenda.repository;

import com.example.quickagenda.entity.Form;
import com.example.quickagenda.entity.FormResponse;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface FormResponseRepository extends JpaRepository<FormResponse, Long> {
    Optional<FormResponse> findByFormAndEmail(Form form, String email);
}
