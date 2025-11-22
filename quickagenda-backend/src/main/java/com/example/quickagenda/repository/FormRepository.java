package com.example.quickagenda.repository;

import com.example.quickagenda.entity.Event;
import com.example.quickagenda.entity.Form;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface FormRepository extends JpaRepository<Form, Long> {
    Optional<Form> findByEvent(Event event);
}
