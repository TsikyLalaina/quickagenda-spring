package com.example.quickagenda.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.OffsetDateTime;

@Entity
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "forms", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"event_id"})
})
public class Form {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false)
    @JoinColumn(name = "event_id", nullable = false)
    private Event event;

    private String title;

    @Column(name = "is_active")
    private boolean active;

    @Column(columnDefinition = "timestamptz")
    private OffsetDateTime openAt;

    @Column(columnDefinition = "timestamptz")
    private OffsetDateTime closeAt;
}
