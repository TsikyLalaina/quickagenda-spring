package com.example.quickagenda.repository;

import com.example.quickagenda.entity.Event;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

public interface EventRepository extends JpaRepository<Event, Long> {
    Optional<Event> findByShareCode(String code);

    @Modifying
    @Transactional
    @Query(value = "UPDATE event SET invites_sent = COALESCE(invites_sent, '[]'::jsonb) || CAST(:emailsJson AS jsonb) WHERE share_code = :code", nativeQuery = true)
    void appendInvitesByShareCode(@Param("code") String code, @Param("emailsJson") String emailsJsonArray);
}
