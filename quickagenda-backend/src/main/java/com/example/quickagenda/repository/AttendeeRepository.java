package com.example.quickagenda.repository;

import com.example.quickagenda.entity.Attendee;
import com.example.quickagenda.entity.Event;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface AttendeeRepository extends JpaRepository<Attendee, Long> {
    List<Attendee> findByEvent(Event event);

    Optional<Attendee> findByEventAndEmail(Event event, String email);
}
